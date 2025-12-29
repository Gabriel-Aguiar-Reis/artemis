import { describe, expect, it, vi } from 'vitest'

describe('useInvalidateQueries helpers', () => {
  it('invalidates dependencies without duplicates', async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const invalidateQueries = vi.fn()
    vi.doMock('@tanstack/react-query', () => ({
      useQueryClient: () => ({ invalidateQueries }),
    }))

    const getQueryKeysToInvalidate = vi
      .fn()
      .mockImplementation((key: string) => {
        const map: Record<string, string[]> = {
          customers: ['customers', 'workOrders'],
          products: ['products', 'workOrders', 'categories'],
        }
        return map[key] ?? [key]
      })

    vi.doMock('../query-invalidation.config', () => ({
      getQueryKeysToInvalidate,
    }))

    const { useInvalidateQueries } = await import('../use-invalidate-queries')
    const invalidate = useInvalidateQueries()

    invalidate(['customers', 'products'])

    expect(getQueryKeysToInvalidate).toHaveBeenCalledTimes(2)
    expect(invalidateQueries).toHaveBeenCalledTimes(4)
    expect(invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: ['customers'],
      refetchType: 'active',
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: ['workOrders'],
      refetchType: 'active',
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(3, {
      queryKey: ['products'],
      refetchType: 'active',
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(4, {
      queryKey: ['categories'],
      refetchType: 'active',
    })
  })

  it('accepts single key values when invalidating dependencies', async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const invalidateQueries = vi.fn()
    vi.doMock('@tanstack/react-query', () => ({
      useQueryClient: () => ({ invalidateQueries }),
    }))

    const getQueryKeysToInvalidate = vi
      .fn()
      .mockImplementation((key: string) => [key, `${key}-child`])

    vi.doMock('../query-invalidation.config', () => ({
      getQueryKeysToInvalidate,
    }))

    const { useInvalidateQueries } = await import('../use-invalidate-queries')
    const invalidate = useInvalidateQueries()

    invalidate('customers')

    expect(getQueryKeysToInvalidate).toHaveBeenCalledWith('customers')
    expect(invalidateQueries).toHaveBeenCalledTimes(2)
    expect(invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: ['customers'],
      refetchType: 'active',
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: ['customers-child'],
      refetchType: 'active',
    })
  })

  it('invalidates exact keys without using dependency map', async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const invalidateQueries = vi.fn()
    vi.doMock('@tanstack/react-query', () => ({
      useQueryClient: () => ({ invalidateQueries }),
    }))

    const getQueryKeysToInvalidate = vi.fn()
    vi.doMock('../query-invalidation.config', () => ({
      getQueryKeysToInvalidate,
    }))

    const { useInvalidateQueriesExact } =
      await import('../use-invalidate-queries')
    const invalidateExact = useInvalidateQueriesExact()

    invalidateExact(['customers', 'products'])

    expect(getQueryKeysToInvalidate).not.toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: ['customers'],
      refetchType: 'all',
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: ['products'],
      refetchType: 'all',
    })
  })

  it('accepts single key values when invalidating exact modes', async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const invalidateQueries = vi.fn()
    vi.doMock('@tanstack/react-query', () => ({
      useQueryClient: () => ({ invalidateQueries }),
    }))

    const getQueryKeysToInvalidate = vi.fn()
    vi.doMock('../query-invalidation.config', () => ({
      getQueryKeysToInvalidate,
    }))

    const { useInvalidateQueriesExact } =
      await import('../use-invalidate-queries')
    const invalidateExact = useInvalidateQueriesExact()

    invalidateExact('customers')

    expect(getQueryKeysToInvalidate).not.toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledOnce()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['customers'],
      refetchType: 'all',
    })
  })
})
