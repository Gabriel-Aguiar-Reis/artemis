import type { Mock } from 'vitest'
import { describe, expect, it, vi } from 'vitest'

describe('workOrderHooks custom mutations', () => {
  it('handles add and clone flows including toast and invalidation behavior', async () => {
    const mutationCalls: any[] = []
    const useMutationMock = vi.fn((options) => {
      mutationCalls.push(options)
      return {
        mutateAsync: (args: any) => options.mutationFn(args),
        options,
      }
    })

    vi.doMock('@tanstack/react-query', () => ({
      useMutation: useMutationMock,
    }))

    const baseHooks = { addWorkOrder: vi.fn() }
    vi.doMock('../create-repository-hooks', () => ({
      createRepositoryHooks: vi.fn(() => baseHooks),
    }))

    const invalidateSpy = vi.fn()
    vi.doMock('../use-invalidate-queries', () => ({
      useInvalidateQueries: () => invalidateSpy,
    }))

    const autoAddMutate = vi.fn()
    vi.doMock('@/src/application/hooks/itinerary-work-order.hooks', () => ({
      useAutoAddWorkOrderToItinerary: () => ({ mutateAsync: autoAddMutate }),
    }))

    const addWorkOrder = vi.fn()
    const getWorkOrder = vi.fn()
    const addCreateFromFinished = vi.fn()
    vi.doMock(
      '@/src/infra/repositories/drizzle/drizzle.work-order.repository',
      () => {
        class MockWorkOrderRepository {
          constructor() {
            Object.assign(this, {
              addWorkOrder,
              getWorkOrder,
              addCreateFromFinished,
            })
          }
        }

        return {
          __esModule: true,
          default: MockWorkOrderRepository,
        }
      }
    )

    const { default: Toast } = await import('react-native-toast-message')
    const toastShow = Toast.show as unknown as Mock

    const { workOrderHooks } = await import('../work-order.hooks')

    const addHook = workOrderHooks.useAddWorkOrderWithItinerary()
    const cloneHook = workOrderHooks.useCloneWorkOrderWithItinerary()

    expect(addHook).toBeDefined()
    expect(cloneHook).toBeDefined()
    expect(mutationCalls).toHaveLength(2)

    const [addOptions, cloneOptions] = mutationCalls

    const payload = { foo: 'bar' } as any

    addWorkOrder.mockResolvedValueOnce('wo-missing')
    getWorkOrder.mockResolvedValueOnce(undefined)
    await expect(addOptions.mutationFn(payload)).rejects.toThrow(
      'Work order criada mas não encontrada'
    )
    expect(addWorkOrder).toHaveBeenCalledWith(payload)
    expect(getWorkOrder).toHaveBeenCalledWith('wo-missing')
    addWorkOrder.mockClear()
    getWorkOrder.mockClear()

    addWorkOrder.mockResolvedValueOnce('wo-result')
    const workOrderWithResult = { id: 'wo-result', result: {} }
    getWorkOrder.mockResolvedValueOnce(workOrderWithResult)
    const hasResult = await addOptions.mutationFn(payload)
    expect(hasResult).toEqual({
      workOrder: workOrderWithResult,
      itineraryResult: { added: false, reason: 'has-result' },
    })
    expect(autoAddMutate).not.toHaveBeenCalled()
    addWorkOrder.mockClear()
    getWorkOrder.mockClear()

    addWorkOrder.mockResolvedValueOnce('wo-prevent')
    const workOrderPrevent = { id: 'wo-prevent' }
    getWorkOrder.mockResolvedValueOnce(workOrderPrevent)
    const prevented = await addOptions.mutationFn({
      ...payload,
      preventItineraryAutoAdd: true,
    })
    expect(prevented).toEqual({
      workOrder: workOrderPrevent,
      itineraryResult: { added: false, reason: 'prevented' },
    })
    expect(autoAddMutate).not.toHaveBeenCalled()
    addWorkOrder.mockClear()
    getWorkOrder.mockClear()

    addWorkOrder.mockResolvedValueOnce('wo-skip')
    const workOrderSkip = { id: 'wo-skip' }
    getWorkOrder.mockResolvedValueOnce(workOrderSkip)
    autoAddMutate.mockResolvedValueOnce({ added: false, reason: 'skipped' })
    const skipped = await addOptions.mutationFn(payload)
    expect(skipped).toEqual({
      workOrder: workOrderSkip,
      itineraryResult: { added: false, reason: 'skipped' },
    })
    expect(autoAddMutate).toHaveBeenCalledTimes(1)

    addWorkOrder.mockResolvedValueOnce('wo-success')
    const workOrderSuccess = { id: 'wo-success' }
    getWorkOrder.mockResolvedValueOnce(workOrderSuccess)
    autoAddMutate.mockResolvedValueOnce({ added: true, itineraryId: 'it-1' })
    const success = await addOptions.mutationFn(payload)
    expect(success).toEqual({
      workOrder: workOrderSuccess,
      itineraryResult: { added: true, itineraryId: 'it-1' },
    })
    expect(autoAddMutate).toHaveBeenCalledTimes(2)

    invalidateSpy.mockClear()
    toastShow.mockClear()
    addOptions.onSuccess?.({
      workOrder: workOrderSkip,
      itineraryResult: { added: false, reason: 'skipped' },
    })
    expect(invalidateSpy).toHaveBeenCalledTimes(3)
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, 'workOrders')
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, 'itineraries')
    expect(invalidateSpy).toHaveBeenNthCalledWith(3, 'itineraryWorkOrders')
    expect(toastShow).toHaveBeenCalledWith({
      type: 'success',
      text1: 'Ordem de serviço adicionada!',
    })

    invalidateSpy.mockClear()
    toastShow.mockClear()
    addOptions.onSuccess?.({
      workOrder: workOrderSuccess,
      itineraryResult: { added: true, itineraryId: 'it-1' },
    })
    expect(invalidateSpy).toHaveBeenCalledTimes(3)
    expect(toastShow).toHaveBeenCalledWith({
      type: 'success',
      text1: 'Ordem de serviço adicionada!',
      text2: 'Também foi adicionada ao itinerário ativo',
    })

    addOptions.onError?.(new Error('failed add'))
    expect(toastShow).toHaveBeenCalledWith({
      type: 'error',
      text1: 'Erro ao adicionar ordem de serviço!',
    })

    autoAddMutate.mockClear()

    addCreateFromFinished.mockResolvedValueOnce('clone-missing')
    getWorkOrder.mockResolvedValueOnce(undefined)
    await expect(
      cloneOptions.mutationFn([
        'original-1',
        new Date('2024-03-01T00:00:00Z'),
        { payment: true },
      ])
    ).rejects.toThrow('Nova ordem clonada não encontrada.')
    expect(addCreateFromFinished).toHaveBeenCalledWith(
      'original-1',
      expect.any(Date),
      { payment: true }
    )

    const clonedWorkOrder = { id: 'clone-success' }
    addCreateFromFinished.mockResolvedValueOnce('clone-success')
    getWorkOrder.mockResolvedValueOnce(clonedWorkOrder)
    autoAddMutate.mockResolvedValueOnce({ added: false, reason: 'skip' })
    const cloneResult = await cloneOptions.mutationFn([
      'original-2',
      new Date('2024-03-02T00:00:00Z'),
      undefined,
    ])
    expect(cloneResult).toEqual({
      workOrder: clonedWorkOrder,
      itineraryResult: { added: false, reason: 'skip' },
    })
    expect(autoAddMutate).toHaveBeenCalledTimes(1)

    invalidateSpy.mockClear()
    toastShow.mockClear()
    cloneOptions.onSuccess?.({ itineraryResult: { added: true } } as any)
    expect(invalidateSpy).toHaveBeenCalledTimes(3)
    expect(toastShow).toHaveBeenCalledWith({
      type: 'success',
      text1: 'Ordem clonada e adicionada ao itinerário!',
    })

    invalidateSpy.mockClear()
    toastShow.mockClear()
    cloneOptions.onSuccess?.({ itineraryResult: { added: false } } as any)
    expect(invalidateSpy).toHaveBeenCalledTimes(3)
    expect(toastShow).toHaveBeenCalledWith({
      type: 'success',
      text1: 'Ordem clonada com sucesso!',
    })

    cloneOptions.onError?.(new Error('clone fail'))
    expect(toastShow).toHaveBeenCalledWith({
      type: 'error',
      text1: 'Erro ao clonar ordem de serviço!',
      text2: 'clone fail',
    })
  })
})
