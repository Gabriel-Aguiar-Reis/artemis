import { describe, expect, it, vi } from 'vitest'

describe('useAutoAddWorkOrderToItinerary', () => {
  it('covers all mutation branches and success invalidation', async () => {
    const mutationCalls: any[] = []
    vi.doMock('@tanstack/react-query', () => ({
      useMutation: vi.fn((options) => {
        mutationCalls.push(options)
        return {
          mutateAsync: (args: any) => options.mutationFn(args),
          options,
        }
      }),
    }))

    const invalidateSpy = vi.fn()
    vi.doMock('../use-invalidate-queries', () => ({
      useInvalidateQueries: () => invalidateSpy,
    }))

    const itineraryRepo = {
      getActiveItinerary: vi.fn(),
    }
    vi.doMock(
      '@/src/infra/repositories/drizzle/drizzle.itinerary.repository',
      () => {
        class MockItineraryRepository {
          constructor() {
            Object.assign(this, itineraryRepo)
          }
        }

        return {
          __esModule: true,
          default: MockItineraryRepository,
        }
      }
    )

    const itineraryWorkOrderRepo = {
      getItineraryWorkOrdersByItineraryId: vi.fn(),
      addItineraryWorkOrder: vi.fn(),
    }
    vi.doMock(
      '@/src/infra/repositories/drizzle/drizzle.itinerary-work-order.repository',
      () => {
        class MockItineraryWorkOrderRepository {
          constructor() {
            Object.assign(this, itineraryWorkOrderRepo)
          }
        }

        return {
          __esModule: true,
          DrizzleItineraryWorkOrderRepository: MockItineraryWorkOrderRepository,
          default: MockItineraryWorkOrderRepository,
        }
      }
    )

    const itineraryWorkOrderInstances: any[] = []
    vi.doMock(
      '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity',
      () => {
        class MockItineraryWorkOrder {
          constructor(
            public id: string,
            public itineraryId: string,
            public position: number,
            public workOrder: any,
            public isLate: boolean
          ) {
            itineraryWorkOrderInstances.push(this)
          }
        }
        return {
          __esModule: true,
          ItineraryWorkOrder: MockItineraryWorkOrder,
        }
      }
    )

    vi.doMock('react-native-uuid', () => ({
      __esModule: true,
      default: { v4: () => 'generated-uuid' },
      v4: () => 'generated-uuid',
    }))

    vi.doMock('../create-repository-hooks', () => ({
      createRepositoryHooks: vi.fn(() => ({})),
    }))

    const { useAutoAddWorkOrderToItinerary } =
      await import('../itinerary-work-order.hooks')

    const hook = useAutoAddWorkOrderToItinerary()
    const options = mutationCalls[0]
    expect(options).toBeDefined()

    const mutateAsync = hook.mutateAsync

    const workOrderBase = {
      id: 'wo-1',
      scheduledDate: new Date('2024-01-02T00:00:00Z'),
    } as any

    const hasResult = await mutateAsync({ ...workOrderBase, result: {} })
    expect(hasResult).toEqual({ added: false, reason: 'has-result' })
    expect(itineraryRepo.getActiveItinerary).not.toHaveBeenCalled()

    itineraryRepo.getActiveItinerary.mockResolvedValueOnce(null)
    const noItinerary = await mutateAsync({ ...workOrderBase, id: 'wo-2' })
    expect(noItinerary).toEqual({ added: false, reason: 'no-active-itinerary' })
    expect(itineraryRepo.getActiveItinerary).toHaveBeenCalledTimes(1)

    const itinerary = {
      id: 'itinerary-1',
      initialItineraryDate: new Date('2024-01-01T00:00:00Z'),
      finalItineraryDate: new Date('2024-01-10T00:00:00Z'),
    }

    itineraryRepo.getActiveItinerary.mockResolvedValueOnce(itinerary)
    const outOfRange = await mutateAsync({
      ...workOrderBase,
      id: 'wo-3',
      scheduledDate: new Date('2024-02-01T00:00:00Z'),
    })
    expect(outOfRange).toEqual({ added: false, reason: 'date-out-of-range' })

    itineraryRepo.getActiveItinerary.mockResolvedValueOnce(itinerary)
    itineraryWorkOrderRepo.getItineraryWorkOrdersByItineraryId.mockResolvedValueOnce(
      [
        { workOrder: { id: 'wo-4' } },
        { workOrder: { id: 'wo-5' } },
        { workOrder: { id: 'wo-6' } },
      ]
    )
    const alreadyExists = await mutateAsync({
      ...workOrderBase,
      id: 'wo-4',
      scheduledDate: new Date('2024-01-02T00:00:00Z'),
    })
    expect(alreadyExists).toEqual({ added: false, reason: 'already-exists' })
    expect(itineraryWorkOrderRepo.addItineraryWorkOrder).not.toHaveBeenCalled()

    itineraryRepo.getActiveItinerary.mockResolvedValueOnce(itinerary)
    itineraryWorkOrderRepo.getItineraryWorkOrdersByItineraryId.mockResolvedValueOnce(
      [{ workOrder: { id: 'other' } }]
    )

    const success = await mutateAsync({
      ...workOrderBase,
      id: 'wo-7',
      scheduledDate: new Date('2024-01-03T00:00:00Z'),
    })
    expect(success).toEqual({ added: true, itineraryId: 'itinerary-1' })
    expect(itineraryWorkOrderRepo.addItineraryWorkOrder).toHaveBeenCalledTimes(
      1
    )
    expect(itineraryWorkOrderInstances).toHaveLength(1)
    const createdInstance = itineraryWorkOrderInstances[0]
    expect(createdInstance.id).toBe('generated-uuid')
    expect(createdInstance.itineraryId).toBe('itinerary-1')
    expect(createdInstance.position).toBe(2)
    expect(createdInstance.workOrder.id).toBe('wo-7')
    expect(createdInstance.isLate).toBe(false)

    invalidateSpy.mockClear()
    options.onSuccess?.({ added: false })
    expect(invalidateSpy).not.toHaveBeenCalled()

    options.onSuccess?.({ added: true })
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, 'itineraryWorkOrders')
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, 'itineraries')
  })
})
