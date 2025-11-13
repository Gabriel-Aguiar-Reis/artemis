import {
  WorkOrder,
  WorkOrderStatus,
} from '@/src/domain/entities/work-order/work-order.entity'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  scheduledDate: text('scheduled_date').notNull(),
  visitDate: text('visit_date'),
  paymentOrderId: text('payment_order_id').notNull(),
  status: text('status').notNull().$type<WorkOrderStatus>(),
  resultId: text('result_id'),
  notes: text('notes'),
}) satisfies Record<keyof WorkOrderModelShape, any>

export type WorkOrderTable = InferSelectModel<typeof workOrder>
export type NewWorkOrderTable = InferInsertModel<typeof workOrder>
