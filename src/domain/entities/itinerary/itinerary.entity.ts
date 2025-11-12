import {
  WorkOrderMapItem,
  WorkOrderMapItemSerializableDTO,
} from '@/src/domain/entities/work-order/work-order-map-item.entity'
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
        'Final date of itinerary cannot be earlier than initial date'
      )
    }
    this._distanceCache = {}
  }

  /**
   * Cache de distâncias entre ordens (chave: 'idA-idB')
   */
  private _distanceCache: Record<string, number>

  /**
   * Retorna a distância entre duas ordens, usando cache
   */
  private getDistanceBetweenOrders(
    orderA: WorkOrder,
    orderB: WorkOrder
  ): number {
    const key = `${orderA.id}-${orderB.id}`
    const reverseKey = `${orderB.id}-${orderA.id}`
    if (this._distanceCache[key] !== undefined) return this._distanceCache[key]
    if (this._distanceCache[reverseKey] !== undefined)
      return this._distanceCache[reverseKey]
    const distance = WorkOrderMapItem.prototype.getDistanceTo.call(
      { workOrder: orderA },
      orderB
    )
    this._distanceCache[key] = distance
    return distance
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
    if (this.isFinished) throw new Error('Itinerary already finished')

    this.markLateOrders()
    this.workOrdersMap.forEach((item) => {
      const wo = item.workOrder
      if (wo.result) wo.status = wo.resolveStatusFromResult(wo.result)
      else if (item.isLate) wo.status = WorkOrderStatus.FAILED
    })

    this.isFinished = true
  }

  get lateOrders(): WorkOrderMapItem[] {
    return this.workOrdersMap.filter((w) => w.isLate)
  }

  optimizeRoute(): void {
    if (this.workOrdersMap.length <= 2) return

    const start = this.workOrdersMap[0]
    const remaining = this.workOrdersMap.slice(1)
    const optimized: WorkOrderMapItem[] = [start]
    let current = start

    while (remaining.length) {
      let nearestIndex = 0
      let nearestDistance = Infinity

      for (let i = 0; i < remaining.length; i++) {
        const distance = this.getDistanceBetweenOrders(
          current.workOrder,
          remaining[i].workOrder
        )
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIndex = i
        }
      }

      current = remaining.splice(nearestIndex, 1)[0]
      optimized.push(current)
    }

    this.workOrdersMap = optimized.map((item, i) => {
      item.position = i + 1
      return item
    })
  }

  getTotalDistance(): number {
    let total = 0
    for (let i = 0; i < this.workOrdersMap.length - 1; i++) {
      const current = this.workOrdersMap[i]
      const next = this.workOrdersMap[i + 1]
      total += current.getDistanceTo(next.workOrder)
    }
    return total
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
