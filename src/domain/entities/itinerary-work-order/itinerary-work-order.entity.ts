import {
  WorkOrder,
  WorkOrderSerializableDTO,
} from '@/src/domain/entities/work-order/work-order.entity'
import { UUID } from '@/src/lib/utils'

export type ItineraryWorkOrderSerializableDTO = {
  id: UUID
  itineraryId: UUID
  position: number
  workOrder: WorkOrderSerializableDTO
  isLate: boolean
}

export class ItineraryWorkOrder {
  constructor(
    public id: UUID,
    public itineraryId: UUID,
    public position: number,
    public workOrder: WorkOrder,
    public isLate: boolean = false
  ) {}

  toDTO(): ItineraryWorkOrderSerializableDTO {
    return {
      id: this.id,
      itineraryId: this.itineraryId,
      position: this.position,
      workOrder: this.workOrder.toDTO(),
      isLate: this.isLate,
    }
  }

  static fromDTO(dto: ItineraryWorkOrderSerializableDTO): ItineraryWorkOrder {
    return new ItineraryWorkOrder(
      dto.id,
      dto.itineraryId,
      dto.position,
      WorkOrder.fromDTO(dto.workOrder),
      dto.isLate
    )
  }
}
