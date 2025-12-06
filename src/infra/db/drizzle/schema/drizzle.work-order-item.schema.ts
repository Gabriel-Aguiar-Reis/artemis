import { product } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

export const workOrderItem = sqliteTable('work_order_item', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  workOrderId: text('work_order_id')
    .references(() => workOrder.id, { onDelete: 'cascade' })
    .notNull(),
  productId: text('product_id')
    .references(() => product.id, { onDelete: 'restrict' })
    .notNull(),
  quantity: integer('quantity').notNull(),
  priceSnapshot: real('price_snapshot').notNull(), // Preço congelado no momento
})

export type WorkOrderItemTable = InferSelectModel<typeof workOrderItem>
export type NewWorkOrderItemTable = InferInsertModel<typeof workOrderItem>
