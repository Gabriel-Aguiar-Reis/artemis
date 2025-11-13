import { PaymentOrder } from '@/src/domain/entities/payment-order/payment-order.entity'
import { PaymentOrderTable } from '@/src/infra/db/drizzle/schema/drizzle.payment-order.schema'
import { UUID } from 'crypto'

export class PaymentOrderMapper {
  static toDomain(table: PaymentOrderTable): PaymentOrder {
    return new PaymentOrder(
      table.id as UUID,
      table.method,
      table.totalValue,
      table.installments,
      table.isPaid,
      table.paidInstallments
    )
  }

  static toPersistence(entity: PaymentOrder): PaymentOrderTable {
    return {
      id: entity.id,
      method: entity.method,
      totalValue: entity.totalValue,
      installments: entity.installments,
      isPaid: entity.isPaid,
      paidInstallments: entity.paidInstallments,
    }
  }
}
