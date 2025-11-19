import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm'
import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

type WorkOrderResultModelShape = Pick<WorkOrderResult, 'id' | 'totalValue'>

export const workOrderResult = sqliteTable('work_order_result', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  totalValue: real('total_value').notNull(),
}) satisfies Record<keyof WorkOrderResultModelShape, any>

export type WorkOrderResultTable = InferSelectModel<typeof workOrderResult>
export type NewWorkOrderResultTable = InferInsertModel<typeof workOrderResult>
