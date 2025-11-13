import { PaymentOrder } from '@/src/domain/entities/payment-order/payment-order.entity'
import { AddPaymentOrderDto } from '@/src/domain/repositories/payment-order/dtos/add-payment-order.dto'
import { UpdatePaymentOrderDto } from '@/src/domain/repositories/payment-order/dtos/update-payment-order.dto'
import { UUID } from 'crypto'

export abstract class PaymentOrderRepository {
  abstract getPaymentOrders: () => Promise<PaymentOrder[]>
  abstract addPaymentOrder: (dto: AddPaymentOrderDto) => Promise<void>
  abstract updatePaymentOrder: (dto: UpdatePaymentOrderDto) => Promise<void>
  abstract deletePaymentOrder: (id: UUID) => Promise<void>
  abstract getPaymentOrder: (id: UUID) => Promise<PaymentOrder | null>
  abstract getUnpaidPaymentOrders: () => Promise<PaymentOrder[]>
}
