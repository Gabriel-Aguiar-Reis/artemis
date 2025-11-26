import {
  WorkOrderMapItem,
  WorkOrderMapItemSerializableDTO,
} from '@/src/domain/entities/work-order-map-item/work-order-map-item.entity'
import {
  WorkOrder,
  WorkOrderStatus,
} from '@/src/domain/entities/work-order/work-order.entity'
import { UUID } from 'crypto'

export type ItinerarySerializableDTO = {
  id: UUID
  workOrdersMap: WorkOrderMapItemSerializableDTO[]
  initialItineraryDate: string
  finalItineraryDate: string
  isFinished: boolean
}

export class Itinerary {
  constructor(
    public id: UUID,
    public workOrdersMap: WorkOrderMapItem[],
    public initialItineraryDate: Date,
    public finalItineraryDate: Date,
    public isFinished: boolean
  ) {
    if (this.finalItineraryDate < this.initialItineraryDate) {
      throw new Error(
        'A data final do itinerário não pode ser anterior à data inicial.'
      )
    }
  }

  addWorkOrder(workOrder: WorkOrder) {
    const position = this.workOrdersMap.length + 1
    this.workOrdersMap.push(new WorkOrderMapItem(position, workOrder))
  }

  markLateOrders(toleranceMinutes: number = 15) {
    this.workOrdersMap.forEach((item) => {
      item.isLate = item.workOrder.isLate(new Date(), toleranceMinutes)
    })
  }

  finish() {
    if (this.isFinished) throw new Error('O itinerário já está finalizado.')

    this.markLateOrders()
    this.workOrdersMap.forEach((item) => {
      const wo = item.workOrder
      if (wo.result) wo.status = wo.applyResult(wo.result)
      else if (item.isLate) wo.status = WorkOrderStatus.FAILED
    })

    this.isFinished = true
  }

  get lateOrders(): WorkOrderMapItem[] {
    return this.workOrdersMap.filter((w) => w.isLate)
  }

  get totalOrders(): number {
    return this.workOrdersMap.length
  }

  get finishedOrders(): number {
    return this.workOrdersMap.filter((w) => w.workOrder.visitDate).length
  }

  get progress(): string {
    return `${this.finishedOrders}/${this.totalOrders}`
  }

  toDTO(): ItinerarySerializableDTO {
    return {
      id: this.id,
      workOrdersMap: this.workOrdersMap.map((item) => item.toDTO()),
      initialItineraryDate: this.initialItineraryDate.toISOString(),
      finalItineraryDate: this.finalItineraryDate.toISOString(),
      isFinished: this.isFinished,
    }
  }

  static fromDTO(dto: ItinerarySerializableDTO): Itinerary {
    return new Itinerary(
      dto.id,
      dto.workOrdersMap.map((item) => WorkOrderMapItem.fromDTO(item)),
      new Date(dto.initialItineraryDate),
      new Date(dto.finalItineraryDate),
      dto.isFinished
    )
  }
}
