import { PaymentOrder } from '@/src/domain/entities/payment-order/payment-order.entity'
import {
  PaymentOrderInsertDTO,
  PaymentOrderUpdateDTO,
} from '@/src/domain/validations/payment-order.schema'
import { UUID } from '@/src/lib/utils'

export abstract class PaymentOrderRepository {
  abstract getPaymentOrders: () => Promise<PaymentOrder[]>
  abstract addPaymentOrder: (dto: PaymentOrderInsertDTO) => Promise<UUID>
  abstract updatePaymentOrder: (dto: PaymentOrderUpdateDTO) => Promise<void>
  abstract deletePaymentOrder: (id: UUID) => Promise<void>
  abstract getPaymentOrder: (id: UUID) => Promise<PaymentOrder | null>
  abstract getUnpaidPaymentOrders: () => Promise<PaymentOrder[]>
}
