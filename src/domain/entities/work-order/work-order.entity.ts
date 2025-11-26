import {
  Customer,
  CustomerSerializableDTO,
} from '@/src/domain/entities/customer/customer.entity'
import {
  PaymentOrder,
  PaymentOrderSerializableDTO,
} from '@/src/domain/entities/payment-order/payment-order.entity'
import { Product } from '@/src/domain/entities/product/product.entity'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import {
  WorkOrderItem,
  WorkOrderItemSerializableDTO,
} from '@/src/domain/entities/work-order-item/work-order-item.entity'
import {
  WorkOrderResult,
  WorkOrderResultSerializableDTO,
} from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { UUID } from '@/src/lib/utils'
import uuid from 'react-native-uuid'

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  COMMITTED = 'COMMITTED',
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
  paymentOrder?: PaymentOrderSerializableDTO
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
    public paymentOrder?: PaymentOrder,
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
      const snapshot = new ProductSnapshot(
        product.id,
        product.name,
        product.salePrice
      )
      this.products.push(
        WorkOrderItem.fromProductSnapshot(snapshot, quantity, product.salePrice)
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
        WorkOrderStatus.COMMITTED,
        WorkOrderStatus.CANCELLED,
      ],
      [WorkOrderStatus.COMMITTED]: [
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
      [WorkOrderStatus.COMMITTED]: 'Comprometida',
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
    if (!this.paymentOrder) return
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

  createFromResult(
    newScheduledDate: Date,
    newPaymentOrder?: PaymentOrderSerializableDTO
  ): WorkOrder {
    if (
      this.status !== WorkOrderStatus.COMPLETED &&
      this.status !== WorkOrderStatus.PARTIAL
    ) {
      throw new Error(
        'Só é possível criar uma nova ordem de serviço a partir de uma ordem concluída ou parcial.'
      )
    }

    const paymentOrder = newPaymentOrder
      ? PaymentOrder.fromDTO({
          id: String(uuid.v4()) as UUID,
          method: newPaymentOrder.method,
          totalValue: newPaymentOrder.totalValue,
          installments: newPaymentOrder.installments ?? 1,
          paidInstallments: 0,
          isPaid: false,
        })
      : undefined

    const items = this.result?.getExchangedAndAddedProducts() ?? []

    return WorkOrder.fromDTO({
      id: String(uuid.v4()) as UUID,
      customer: this.customer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledDate: newScheduledDate.toISOString(),
      paymentOrder,
      products: items,
      status: WorkOrderStatus.PENDING,
      result: undefined,
      visitDate: undefined,
      notes: this.notes,
    })
  }

  finalizeAfterPayment(): WorkOrderStatus {
    if (!this.paymentOrder || !this.paymentOrder.isPaid)
      throw new Error(
        'Não é possível finalizar a ordem de serviço sem o pagamento concluído.'
      )
    this.status = WorkOrderStatus.COMPLETED
    this.updatedAt = new Date()
    return this.status
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
      dto.paymentOrder ? PaymentOrder.fromDTO(dto.paymentOrder) : undefined,
      dto.products?.map((p) => WorkOrderItem.fromDTO(p)) ?? [],
      dto.status,
      dto.result ? WorkOrderResult.fromDTO(dto.result) : undefined,
      dto.visitDate ? new Date(dto.visitDate) : undefined,
      dto.notes
    )
  }
}
