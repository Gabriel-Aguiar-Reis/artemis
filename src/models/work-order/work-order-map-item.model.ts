import {
  WorkOrder,
  WorkOrderSerializableDTO,
} from '@/src/models/work-order/work-order.model'

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

  getDistanceTo(next: WorkOrder): number {
    const from = this.workOrder.customer.storeAddress.coordinates
    const to = next.customer.storeAddress.coordinates
    if (!from || !to) return 0

    const R = 6371
    const dLat = this.deg2rad(to.latitude - from.latitude)
    const dLon = this.deg2rad(to.longitude - from.longitude)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.deg2rad(from.latitude)) *
        Math.cos(this.deg2rad(to.latitude)) *
        Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

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
