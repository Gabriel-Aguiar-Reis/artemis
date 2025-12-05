import { WorkOrderResultItemType } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { product } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import { workOrderResult } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result.schema'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

export const workOrderResultItem = sqliteTable('work_order_result_item', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  resultId: text('result_id')
    .references(() => workOrderResult.id, { onDelete: 'cascade' })
    .notNull(),
  productId: text('product_id')
    .references(() => product.id, { onDelete: 'restrict' })
    .notNull(),
  quantity: integer('quantity').notNull(),
  priceSnapshot: real('price_snapshot').notNull(),
  type: text('type').notNull().$type<WorkOrderResultItemType>(),
  observation: text('observation'),
})

export type WorkOrderResultItemTable = InferSelectModel<
  typeof workOrderResultItem
>
export type NewWorkOrderResultItemTable = InferInsertModel<
  typeof workOrderResultItem
>
