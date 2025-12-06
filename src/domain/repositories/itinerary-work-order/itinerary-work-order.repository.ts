import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { UUID } from '@/src/lib/utils'

export abstract class ItineraryWorkOrderRepository {
  abstract getItineraryWorkOrdersByItineraryId(
    itineraryId: UUID
  ): Promise<ItineraryWorkOrder[]>

  abstract getItineraryWorkOrder(id: UUID): Promise<ItineraryWorkOrder>

  abstract addItineraryWorkOrder(item: ItineraryWorkOrder): Promise<void>

  abstract addItineraryWorkOrders(items: ItineraryWorkOrder[]): Promise<void>

  abstract updateItineraryWorkOrder(item: ItineraryWorkOrder): Promise<void>

  abstract clearIsLateByWorkOrderId(workOrderId: UUID): Promise<void>

  abstract updatePositions(
    items: { id: UUID; position: number }[]
  ): Promise<void>

  abstract deleteItineraryWorkOrder(id: UUID): Promise<void>
}
