import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const storage = vi.hoisted(() => new Map<string, string>())
const setParams = vi.hoisted(() => vi.fn())

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (k: string) => storage.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => {
      storage.set(k, v)
    }),
  },
}))

vi.mock('expo-router', () => ({ useNavigation: () => ({ setParams }) }))

async function load() {
  vi.resetModules()
  const store = await import('@/src/lib/last-tab')
  const hook = await import('@/src/application/hooks/use-persisted-tab-filters')
  await store.loadLastTab()
  return { store, hook }
}

const savedFilters = () => JSON.parse(storage.get('tab-filters') ?? '{}')

describe('usePersistedTabFilters', () => {
  beforeEach(() => {
    storage.clear()
    setParams.mockClear()
  })

  it('restores the saved filters on the first mount after a cold start', async () => {
    storage.set(
      'tab-filters',
      JSON.stringify({ customers: { search: 'padaria' } })
    )
    const { hook } = await load()

    renderHook(() => hook.usePersistedTabFilters('customers', {}))

    expect(setParams).toHaveBeenCalledWith({ search: 'padaria' })
    // nothing was overwritten with the empty params
    expect(savedFilters().customers).toEqual({ search: 'padaria' })
  })

  it('saves every change, including clearing the filters', async () => {
    const { hook } = await load()
    const { rerender } = renderHook(
      ({ params }) => hook.usePersistedTabFilters('work-orders', params),
      { initialProps: { params: { search: 'acai' } as Record<string, string> } }
    )
    expect(savedFilters()['work-orders']).toEqual({ search: 'acai' })

    rerender({ params: { search: 'acai', isPaid: 'true' } })
    expect(savedFilters()['work-orders']).toEqual({
      search: 'acai',
      isPaid: 'true',
    })

    rerender({ params: {} })
    expect(savedFilters()['work-orders']).toEqual({})
  })

  it('restores only once per session, so clearing later sticks', async () => {
    storage.set('tab-filters', JSON.stringify({ products: { search: 'agua' } }))
    const { hook } = await load()

    const first = renderHook(() => hook.usePersistedTabFilters('products', {}))
    first.unmount()
    setParams.mockClear()

    // remounting the list in the same session with no filters = user cleared
    renderHook(() => hook.usePersistedTabFilters('products', {}))
    expect(setParams).not.toHaveBeenCalled()
    expect(savedFilters().products).toEqual({})
  })

  it('ignores transient params and empty values', async () => {
    const { hook } = await load()
    renderHook(() =>
      hook.usePersistedTabFilters('work-orders', {
        search: 'x',
        createdWorkOrderId: 'abc',
        phoneNumber: '',
        visitDate: undefined,
      })
    )
    expect(savedFilters()['work-orders']).toEqual({ search: 'x' })
  })

  it('keeps filters of other tabs untouched', async () => {
    storage.set(
      'tab-filters',
      JSON.stringify({ categories: { status: 'inactive' } })
    )
    const { hook } = await load()
    renderHook(() =>
      hook.usePersistedTabFilters('customers', { search: 'mercado' })
    )
    expect(savedFilters()).toEqual({
      categories: { status: 'inactive' },
      customers: { search: 'mercado' },
    })
  })

  it('survives corrupted storage', async () => {
    storage.set('tab-filters', '{not json')
    storage.set('last-tab', 'nope')
    const { store } = await load()
    expect(store.getLastTab()).toBe('itinerary')
    expect(store.getTabFilters('customers')).toEqual({})
  })
})
