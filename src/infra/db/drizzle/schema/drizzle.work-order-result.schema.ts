import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

type WorkOrderResultModelShape = Pick<WorkOrderResult, 'id' | 'totalValue'>

export const workOrderResult = sqliteTable('work_order_result', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  totalValue: real('total_value').notNull(),
}) satisfies Record<keyof WorkOrderResultModelShape, any>

export type WorkOrderResultTable = InferSelectModel<typeof workOrderResult>
export type NewWorkOrderResultTable = InferInsertModel<typeof workOrderResult>
