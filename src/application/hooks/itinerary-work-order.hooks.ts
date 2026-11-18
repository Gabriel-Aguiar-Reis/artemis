import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import { useInvalidateQueries } from '@/src/application/hooks/use-invalidate-queries'
import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { isOpenStatus } from '@/src/domain/entities/work-order/work-order-rules'
import {
  WorkOrder,
  WorkOrderStatus,
} from '@/src/domain/entities/work-order/work-order.entity'
import { DrizzleItineraryWorkOrderRepository } from '@/src/infra/repositories/drizzle/drizzle.itinerary-work-order.repository'
import DrizzleItineraryRepository from '@/src/infra/repositories/drizzle/drizzle.itinerary.repository'
import { UUID } from '@/src/lib/utils'
import { useMutation } from '@tanstack/react-query'
import uuid from 'react-native-uuid'

const itineraryWorkOrderRepo = new DrizzleItineraryWorkOrderRepository()
const itineraryRepo = new DrizzleItineraryRepository()

export const itineraryWorkOrderHooks = createRepositoryHooks(
  itineraryWorkOrderRepo,
  'itineraryWorkOrders',
  'Ordem de serviço do itinerário',
  'F'
)

/**
 * Hook to automatically add a work order to the active itinerary
 * if the scheduled date falls within the itinerary period
 */
export function useAutoAddWorkOrderToItinerary() {
  const invalidateQueries = useInvalidateQueries()

  return useMutation({
    mutationFn: async (workOrder: WorkOrder) => {
      // IMPORTANT: Check whether the work order already has a result (finished)
      // Finished work orders must NOT be added to the itinerary
      if (workOrder.result) {
        return { added: false, reason: 'has-result' }
      }

      // Fetch the active itinerary
      const itinerary = await itineraryRepo.getActiveItinerary()

      if (!itinerary) {
        // No active itinerary, do nothing
        return { added: false, reason: 'no-active-itinerary' }
      }

      // Check whether the scheduled date is within the itinerary period
      // Compare by day in the device timezone: the itinerary end is stored
      // as 00:00 of the last day, and work orders of that day used to be left out.
      const scheduledDate = workOrder.scheduledDate
      const periodStart = new Date(itinerary.initialItineraryDate)
      periodStart.setHours(0, 0, 0, 0)
      const periodEnd = new Date(itinerary.finalItineraryDate)
      periodEnd.setHours(23, 59, 59, 999)
      const isInPeriod =
        scheduledDate >= periodStart && scheduledDate <= periodEnd

      if (!isInPeriod) {
        // Date outside the period, do not add
        return { added: false, reason: 'date-out-of-range' }
      }

      // Only open work orders enter the itinerary
      if (workOrder.status === WorkOrderStatus.EXPIRED) {
        return { added: false, reason: 'expired' }
      }
      if (workOrder.status === WorkOrderStatus.COPIED) {
        return { added: false, reason: 'copied' }
      }
      if (!isOpenStatus(workOrder.status)) {
        return { added: false, reason: 'closed' }
      }

      // Check whether it already has a payment order
      if (workOrder.paymentOrder) {
        return { added: false, reason: 'has-payment-order' }
      }

      // Check whether it is not already in the itinerary
      const existingWorkOrders =
        await itineraryWorkOrderRepo.getItineraryWorkOrdersByItineraryId(
          itinerary.id
        )
      const alreadyExists = existingWorkOrders.some(
        (iwo) => iwo.workOrder.id === workOrder.id
      )

      if (alreadyExists) {
        return { added: false, reason: 'already-exists' }
      }

      // Add to the itinerary at the last position
      const newPosition = existingWorkOrders.length + 1
      const itineraryWorkOrder = new ItineraryWorkOrder(
        uuid.v4() as UUID,
        itinerary.id,
        newPosition,
        workOrder,
        false // isLate
      )

      await itineraryWorkOrderRepo.addItineraryWorkOrder(itineraryWorkOrder)

      return { added: true, itineraryId: itinerary.id }
    },
    onSuccess: (result) => {
      if (result.added) {
        // Invalidate related queries
        invalidateQueries('itineraryWorkOrders')
        invalidateQueries('itineraries')
      }
    },
  })
}
