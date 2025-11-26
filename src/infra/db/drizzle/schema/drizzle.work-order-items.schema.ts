import { product } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const workOrderItems = sqliteTable('work_order_items', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
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
