import { Itinerary } from '@/src/domain/entities/itinerary/itinerary.entity'
import { WorkOrderMapItem } from '@/src/domain/entities/work-order-map-item/work-order-map-item.entity'
import { ItineraryTable } from '@/src/infra/db/drizzle/schema/drizzle.itinerary.schema'
import { UUID } from 'crypto'

export class ItineraryMapper {
  static toDomain(
    table: ItineraryTable,
    workOrdersMap: WorkOrderMapItem[]
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
