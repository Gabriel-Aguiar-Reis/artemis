import {
  ItineraryWorkOrder,
  ItineraryWorkOrderSerializableDTO,
} from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import {
  WorkOrder,
  WorkOrderStatus,
} from '@/src/domain/entities/work-order/work-order.entity'
import { UUID } from '@/src/lib/utils'
import uuid from 'react-native-uuid'

export type ItinerarySerializableDTO = {
  id: UUID
  workOrders: ItineraryWorkOrderSerializableDTO[]
  initialItineraryDate: string
  finalItineraryDate: string
  isFinished: boolean
}

export class Itinerary {
  constructor(
    public id: UUID,
    public workOrders: ItineraryWorkOrder[],
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
    const position = this.workOrders.length + 1
    const id = uuid.v4() as UUID
    const itineraryId = this.id
    this.workOrders.push(
      new ItineraryWorkOrder(id, itineraryId, position, workOrder)
    )
  }

  markLateOrders(toleranceMinutes: number = 15) {
    this.workOrders.forEach((item) => {
      item.isLate = item.workOrder.isLate(new Date(), toleranceMinutes)
    })
  }

  finish() {
    if (this.isFinished) throw new Error('O itinerário já está finalizado.')

    this.markLateOrders()
    this.workOrders.forEach((item) => {
      const wo = item.workOrder
      if (wo.result) wo.status = wo.applyResult(wo.result)
      else if (item.isLate) wo.status = WorkOrderStatus.FAILED
    })

    this.isFinished = true
  }

  get lateOrders(): ItineraryWorkOrder[] {
    return this.workOrders.filter((w) => w.isLate)
  }

  get totalOrders(): number {
    return this.workOrders.length
  }

  get finishedOrders(): number {
    return this.workOrders.filter((w) => w.workOrder.visitDate).length
  }

  get progress(): string {
    return `${this.finishedOrders}/${this.totalOrders}`
  }

  toDTO(): ItinerarySerializableDTO {
    return {
      id: this.id,
      workOrders: this.workOrders.map((item) => item.toDTO()),
      initialItineraryDate: this.initialItineraryDate.toISOString(),
      finalItineraryDate: this.finalItineraryDate.toISOString(),
      isFinished: this.isFinished,
    }
  }

  static fromDTO(dto: ItinerarySerializableDTO): Itinerary {
    return new Itinerary(
      dto.id,
      dto.workOrders.map((item) => ItineraryWorkOrder.fromDTO(item)),
      new Date(dto.initialItineraryDate),
      new Date(dto.finalItineraryDate),
      dto.isFinished
    )
  }
}
