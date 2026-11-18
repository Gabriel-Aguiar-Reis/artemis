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
import {
  isFinalStatus,
  resolveResultStatus,
} from '@/src/domain/entities/work-order/work-order-rules'
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
  EXPIRED = 'EXPIRED',
  COPIED = 'COPIED',
}

export type WorkOrderSerializableDTO = {
  id: UUID
  customer: CustomerSerializableDTO
  createdAt: string
  updatedAt: string
  scheduledDate: string
  paymentOrder?: PaymentOrderSerializableDTO
  products?: WorkOrderItemSerializableDTO[]
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
    public products?: WorkOrderItem[],
    public status: WorkOrderStatus = WorkOrderStatus.PENDING,
    public result?: WorkOrderResult,
    public visitDate?: Date,
    public notes?: string
  ) {}

  addProduct(product: Product, quantity: number) {
    if (quantity <= 0) throw new Error('A quantidade deve ser maior que zero.')

    if (!this.products) this.products = []

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

    if (!this.products) return

    const existing = this.products.find((p) => p.productId === product.id)
    if (!existing) return
    existing.quantity -= quantity
    if (existing.quantity <= 0) {
      this.products = this.products.filter((p) => p.productId !== product.id)
    }
    this.updatedAt = new Date()
  }

  get totalAmountForProducts(): number {
    if (!this.products) return 0

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
    // Permitir transições idempotentes (mesmo status) sem erro
    if (newStatus === this.status) return this.status

    const validTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      // Na prática a visita é registrada direto de PENDING (não há tela de
      // "iniciar visita"), então o relatório pode encerrar a OS a partir dela.
      [WorkOrderStatus.PENDING]: [
        WorkOrderStatus.COMMITTED,
        WorkOrderStatus.IN_PROGRESS,
        WorkOrderStatus.CANCELLED,
        WorkOrderStatus.COMPLETED,
        WorkOrderStatus.PARTIAL,
        WorkOrderStatus.FAILED,
        WorkOrderStatus.EXPIRED,
      ],
      [WorkOrderStatus.COMMITTED]: [
        WorkOrderStatus.IN_PROGRESS,
        WorkOrderStatus.CANCELLED,
        WorkOrderStatus.COMPLETED,
        WorkOrderStatus.PARTIAL,
        WorkOrderStatus.FAILED,
        WorkOrderStatus.EXPIRED,
      ],
      [WorkOrderStatus.IN_PROGRESS]: [
        WorkOrderStatus.COMPLETED,
        WorkOrderStatus.PARTIAL,
        WorkOrderStatus.FAILED,
      ],
      [WorkOrderStatus.COMPLETED]: [WorkOrderStatus.COPIED],
      [WorkOrderStatus.PARTIAL]: [WorkOrderStatus.COPIED],
      [WorkOrderStatus.CANCELLED]: [],
      [WorkOrderStatus.FAILED]: [],
      [WorkOrderStatus.EXPIRED]: [WorkOrderStatus.COPIED],
      [WorkOrderStatus.COPIED]: [],
    }

    const statusLabels: Record<WorkOrderStatus, string> = {
      [WorkOrderStatus.PENDING]: 'Pendente',
      [WorkOrderStatus.COMMITTED]: 'Comprometida',
      [WorkOrderStatus.IN_PROGRESS]: 'Em andamento',
      [WorkOrderStatus.COMPLETED]: 'Concluída',
      [WorkOrderStatus.PARTIAL]: 'Parcial',
      [WorkOrderStatus.CANCELLED]: 'Cancelada',
      [WorkOrderStatus.FAILED]: 'Falhada',
      [WorkOrderStatus.EXPIRED]: 'Expirada',
      [WorkOrderStatus.COPIED]: 'Clonada',
    }

    if (!validTransitions[this.status]) {
      // Status atual desconhecido ou inválido (ex: dado corrompido) — recupera silenciosamente
      this.status = newStatus
      this.updatedAt = new Date()
      return this.status
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
    return this.setStatus(
      resolveResultStatus({
        scheduled: this.products?.length ?? 0,
        exchanged: result.exchangedProducts?.length ?? 0,
        added: result.addedProducts?.length ?? 0,
        removed: result.removedProducts?.length ?? 0,
      })
    )
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
      this.status !== WorkOrderStatus.PARTIAL &&
      this.status !== WorkOrderStatus.EXPIRED
    ) {
      throw new Error(
        'Só é possível criar uma nova ordem de serviço a partir de uma ordem concluída, parcial ou expirada.'
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

    // Para ordens EXPIRED (sem resultado), usa produtos agendados
    // Para ordens COMPLETED/PARTIAL, usa produtos do resultado (trocados + adicionados)
    const items =
      this.status === WorkOrderStatus.EXPIRED
        ? (this.products?.map((p) => p.toDTO()) ?? [])
        : (this.result?.getExchangedAndAddedProducts() ?? [])

    return WorkOrder.fromDTO({
      id: String(uuid.v4()) as UUID,
      customer: this.customer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledDate: newScheduledDate.toISOString(),
      paymentOrder: paymentOrder ? paymentOrder.toDTO() : undefined,
      products: items,
      status: WorkOrderStatus.PENDING,
      result: undefined,
      visitDate: undefined,
      notes: this.notes,
    })
  }

  /**
   * Pagamento quitado não decide o status da OS: quem decide é o relatório.
   * Antes forçava COMPLETED em qualquer caso (PARTIAL/FAILED viravam
   * COMPLETED e uma OS já clonada voltava a poder ser clonada).
   * - status final: mantém
   * - em aberto com relatório: aplica o status do relatório
   * - em aberto sem relatório: mantém (pagamento antecipado)
   */
  finalizeAfterPayment(): WorkOrderStatus {
    if (!this.paymentOrder || !this.paymentOrder.isPaid)
      throw new Error(
        'Não é possível finalizar a ordem de serviço sem o pagamento concluído.'
      )
    if (isFinalStatus(this.status)) return this.status
    if (this.result) return this.applyResult(this.result)
    return this.status
  }

  toDTO(): WorkOrderSerializableDTO {
    return {
      id: this.id,
      customer: this.customer?.toDTO ? this.customer.toDTO() : this.customer,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      scheduledDate: this.scheduledDate.toISOString(),
      paymentOrder: this.paymentOrder ? this.paymentOrder.toDTO() : undefined,
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
