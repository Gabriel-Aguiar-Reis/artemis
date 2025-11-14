import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { product } from './drizzle.product.schema'
import { workOrder } from './drizzle.work-order.schema'

export const workOrderItems = sqliteTable('work_order_items', {
  id: text('id').primaryKey(),
  workOrderId: text('work_order_id')
    .references(() => workOrder.id, { onDelete: 'cascade' })
    .notNull(),
  productId: text('product_id')
    .references(() => product.id)
    .notNull(),
  quantity: integer('quantity').notNull(),
  priceSnapshot: real('price_snapshot').notNull(), // Preço congelado no momento
})

export type WorkOrderItemsTable = InferSelectModel<typeof workOrderItems>
export type NewWorkOrderItemsTable = InferInsertModel<typeof workOrderItems>
