import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { Itinerary } from '@/src/domain/entities/itinerary/itinerary.entity'
import { ItineraryTable } from '@/src/infra/db/drizzle/schema/drizzle.itinerary.schema'
import { UUID } from '@/src/lib/utils'

export class ItineraryMapper {
  static toDomain(
    table: ItineraryTable,
    workOrdersMap: ItineraryWorkOrder[]
  ): Itinerary {
    return new Itinerary(
      table.id as UUID,
      workOrdersMap,
      new Date(table.initialItineraryDate),
      new Date(table.finalItineraryDate),
      table.isFinished
    )
  }

  static toPersistence(entity: Itinerary): ItineraryTable {
    return {
      id: entity.id,
      initialItineraryDate: entity.initialItineraryDate.toISOString(),
      finalItineraryDate: entity.finalItineraryDate.toISOString(),
      isFinished: entity.isFinished,
    }
  }
}
