import { WorkOrderMapItemSerializableDTO } from '@/src/domain/entities/work-order-map-item/work-order-map-item.entity'

export interface UpdateItineraryDto {
  id: string
  workOrdersMap: WorkOrderMapItemSerializableDTO[]
  initialItineraryDate: string
  finalItineraryDate: string
  isFinished: boolean
}
