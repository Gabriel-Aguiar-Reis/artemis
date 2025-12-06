import { PaymentOrder } from '@/src/domain/entities/payment-order/payment-order.entity'
import { PaymentOrderTable } from '@/src/infra/db/drizzle/schema/drizzle.payment-order.schema'
import { UUID } from '@/src/lib/utils'

export class PaymentOrderMapper {
  static toDomain(table: PaymentOrderTable): PaymentOrder {
    return PaymentOrder.fromDTO({
      id: table.id as UUID,
      method: table.method,
      totalValue: table.totalValue,
      installments: table.installments,
      isPaid: table.isPaid,
      paidInstallments: table.paidInstallments,
    })
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
