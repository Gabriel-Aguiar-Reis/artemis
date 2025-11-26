import {
  WorkOrder,
  WorkOrderStatus,
} from '@/src/domain/entities/work-order/work-order.entity'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { paymentOrder } from '@/src/infra/db/drizzle/schema/drizzle.payment-order.schema'
import { workOrderResult } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result.schema'
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

type WorkOrderModelShape = Pick<WorkOrder, 'id' | 'status' | 'notes'> & {
  customerId: string
  createdAt: string
  updatedAt: string
  scheduledDate: string
  visitDate: string | null
  paymentOrderId: string
  resultId: string | null
}

export const workOrder = sqliteTable('work_order', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  customerId: text('customer_id')
    .references(() => customer.id)
    .notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  scheduledDate: text('scheduled_date').notNull(),
  visitDate: text('visit_date'),
  paymentOrderId: text('payment_order_id').references(() => paymentOrder.id),
  status: text('status').notNull().$type<WorkOrderStatus>(),
  resultId: text('result_id').references(() => workOrderResult.id),
  notes: text('notes'),
}) satisfies Record<keyof WorkOrderModelShape, any>

export type WorkOrderTable = InferSelectModel<typeof workOrder>
export type NewWorkOrderTable = InferInsertModel<typeof workOrder>
