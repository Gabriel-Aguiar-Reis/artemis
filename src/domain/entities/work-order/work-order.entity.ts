import {
  Customer,
  CustomerSerializableDTO,
} from '@/src/domain/entities/customer/customer.entity'
import {
  PaymentOrder,
  PaymentOrderSerializableDTO,
} from '@/src/domain/entities/payment-order/payment-order.entity'
import { Product } from '@/src/domain/entities/product/product.entity'
import {
  WorkOrderItem,
  WorkOrderItemSerializableDTO,
} from '@/src/domain/entities/work-order-item/work-order-item.entity'
import {
  WorkOrderResult,
  WorkOrderResultSerializableDTO,
} from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { UUID } from 'crypto'

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export type WorkOrderSerializableDTO = {
  id: UUID
  customer: CustomerSerializableDTO
  createdAt: string
  updatedAt: string
  scheduledDate: string
  paymentOrder: PaymentOrderSerializableDTO
  products: WorkOrderItemSerializableDTO[]
  status: WorkOrderStatus
  result?: WorkOrderResultSerializableDTO
  visitDate?: string
  notes?: string
}

export class WorkOrder {
  constructor(
    public id: UUID,
    public customer: Customer,
    public createdAt: Date,
    public updatedAt: Date,
    public scheduledDate: Date,
    public paymentOrder: PaymentOrder,
    public products: WorkOrderItem[] = [],
    public status: WorkOrderStatus = WorkOrderStatus.PENDING,
    public result?: WorkOrderResult,
    public visitDate?: Date,
    public notes?: string
  ) {}

  addProduct(product: Product, quantity: number) {
    if (quantity <= 0) throw new Error('A quantidade deve ser maior que zero.')
    const existing = this.products.find((p) => p.productId === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      this.products.push(
        WorkOrderItem.fromProduct(product, quantity, product.salePrice)
      )
    }
    this.updatedAt = new Date()
  }

  removeProduct(product: Product, quantity: number) {
    if (quantity <= 0) throw new Error('A quantidade deve ser maior que zero.')
    const existing = this.products.find((p) => p.productId === product.id)
    if (!existing) return
    existing.quantity -= quantity
    if (existing.quantity <= 0) {
      this.products = this.products.filter((p) => p.productId !== product.id)
    }
    this.updatedAt = new Date()
  }

  get totalAmount(): number {
    return this.products.reduce((sum, p) => sum + p.total, 0)
  }

  isLate(
    referenceDate: Date = new Date(),
    toleranceMinutes: number = 15
  ): boolean {
    if (this.visitDate) return false
    return (
      this.scheduledDate.getTime() + toleranceMinutes * 60000 <
      referenceDate.getTime()
    )
  }

  setStatus(newStatus: WorkOrderStatus): WorkOrderStatus {
    const validTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      [WorkOrderStatus.PENDING]: [
        WorkOrderStatus.IN_PROGRESS,
        WorkOrderStatus.CANCELLED,
      ],
      [WorkOrderStatus.IN_PROGRESS]: [
        WorkOrderStatus.COMPLETED,
        WorkOrderStatus.PARTIAL,
        WorkOrderStatus.FAILED,
      ],
      [WorkOrderStatus.COMPLETED]: [],
      [WorkOrderStatus.PARTIAL]: [],
      [WorkOrderStatus.CANCELLED]: [],
      [WorkOrderStatus.FAILED]: [],
    }

    const statusLabels: Record<WorkOrderStatus, string> = {
      [WorkOrderStatus.PENDING]: 'Pendente',
      [WorkOrderStatus.IN_PROGRESS]: 'Em andamento',
      [WorkOrderStatus.COMPLETED]: 'Concluída',
      [WorkOrderStatus.PARTIAL]: 'Parcial',
      [WorkOrderStatus.CANCELLED]: 'Cancelada',
      [WorkOrderStatus.FAILED]: 'Falhada',
    }

    if (!validTransitions[this.status]?.includes(newStatus))
      throw new Error(
        `Transição de status inválida: ${statusLabels[this.status]} → ${statusLabels[newStatus]}`
      )

    this.status = newStatus
    this.updatedAt = new Date()
    return this.status
  }

  private resolveStatusFromResult(result: WorkOrderResult): WorkOrderStatus {
    const exchanged = result.exchangedProducts.length
    const removed = result.removedProducts?.length ?? 0
    const added = result.addedProducts?.length ?? 0

    if (exchanged === 0 && added === 0)
      return this.setStatus(WorkOrderStatus.FAILED)
    if (removed > 0 || exchanged < this.products.length)
      return this.setStatus(WorkOrderStatus.PARTIAL)
    return this.setStatus(WorkOrderStatus.COMPLETED)
  }

  applyResult(result: WorkOrderResult): WorkOrderStatus {
    this.result = result
    this.status = this.resolveStatusFromResult(result)
    this.updatedAt = new Date()
    return this.status
  }

  syncPaymentWithResult() {
    if (!this.result) return
    this.paymentOrder.totalValue = this.result.totalValue
  }

  startVisit() {
    if (this.status !== WorkOrderStatus.PENDING)
      throw new Error(
        'Não é possível iniciar uma ordem de serviço que não está pendente.'
      )
    this.status = WorkOrderStatus.IN_PROGRESS
    this.visitDate = new Date()
  }

  toDTO(): WorkOrderSerializableDTO {
    return {
      id: this.id,
      customer: this.customer?.toDTO ? this.customer.toDTO() : this.customer,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      scheduledDate: this.scheduledDate.toISOString(),
      paymentOrder: this.paymentOrder?.toDTO
        ? this.paymentOrder.toDTO()
        : this.paymentOrder,
      products: this.products?.map((p) => (p.toDTO ? p.toDTO() : p)),
      status: this.status,
      result: this.result?.toDTO(),
      visitDate: this.visitDate?.toISOString(),
      notes: this.notes,
    }
  }

  static fromDTO(dto: WorkOrderSerializableDTO): WorkOrder {
    return new WorkOrder(
      dto.id,
      Customer.fromDTO(dto.customer),
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
      new Date(dto.scheduledDate),
      PaymentOrder.fromDTO(dto.paymentOrder),
      dto.products?.map((p) => WorkOrderItem.fromDTO(p)) ?? [],
      dto.status,
      dto.result ? WorkOrderResult.fromDTO(dto.result) : undefined,
      dto.visitDate ? new Date(dto.visitDate) : undefined,
      dto.notes
    )
  }
}
