import {
  WorkOrder,
  WorkOrderSerializableDTO,
} from '@/src/domain/entities/work-order/work-order.entity'

export type WorkOrderMapItemSerializableDTO = {
  position: number
  workOrder: WorkOrderSerializableDTO
  isLate: boolean
}

export class WorkOrderMapItem {
  constructor(
    public position: number,
    public workOrder: WorkOrder,
    public isLate: boolean = false
  ) {}

  toDTO(): WorkOrderMapItemSerializableDTO {
    return {
      position: this.position,
      workOrder: this.workOrder.toDTO(),
      isLate: this.isLate,
    }
  }

  static fromDTO(dto: WorkOrderMapItemSerializableDTO): WorkOrderMapItem {
    return new WorkOrderMapItem(
      dto.position,
      WorkOrder.fromDTO(dto.workOrder),
      dto.isLate
    )
  }
}
