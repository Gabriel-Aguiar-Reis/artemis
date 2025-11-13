import { PaymentOrder } from '@/src/domain/entities/payment-order/payment-order.entity'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

type PaymentOrderModelShape = Pick<
  PaymentOrder,
  | 'id'
  | 'method'
  | 'totalValue'
  | 'installments'
  | 'isPaid'
  | 'paidInstallments'
>

export const paymentOrder = sqliteTable('payment_order', {
  id: text('id').primaryKey(),
  method: text('method').notNull(),
  totalValue: real('total_value').notNull(),
  installments: integer('installments').notNull().default(1),
  isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
  paidInstallments: integer('paid_installments').notNull().default(0),
}) satisfies Record<keyof PaymentOrderModelShape, any>

export type PaymentOrderTable = InferSelectModel<typeof paymentOrder>
export type NewPaymentOrderTable = InferInsertModel<typeof paymentOrder>
