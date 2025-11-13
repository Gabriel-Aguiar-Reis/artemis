import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { product } from './drizzle.product.schema'
import { workOrderResult } from './drizzle.work-order-result.schema'

export enum WorkOrderResultItemType {
  EXCHANGED = 'exchanged',
  ADDED = 'added',
  REMOVED = 'removed',
}

export const workOrderResultItems = sqliteTable('work_order_result_items', {
  id: text('id').primaryKey(),
  resultId: text('result_id')
    .notNull()
    .references(() => workOrderResult.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => product.id),
  quantity: integer('quantity').notNull(),
  priceSnapshot: real('price_snapshot').notNull(),
  type: text('type').notNull().$type<WorkOrderResultItemType>(),
  observation: text('observation'),
})

export type WorkOrderResultItemsTable = InferSelectModel<
  typeof workOrderResultItems
>
export type NewWorkOrderResultItemsTable = InferInsertModel<
  typeof workOrderResultItems
>
