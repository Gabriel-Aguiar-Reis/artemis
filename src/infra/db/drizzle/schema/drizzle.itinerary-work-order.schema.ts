import { itinerary } from '@/src/infra/db/drizzle/schema/drizzle.itinerary.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

export const itineraryWorkOrder = sqliteTable('itinerary_work_order', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  itineraryId: text('itinerary_id')
    .references(() => itinerary.id, { onDelete: 'cascade' })
    .notNull(),
  workOrderId: text('work_order_id')
    .references(() => workOrder.id, { onDelete: 'cascade' })
    .notNull(),
  position: integer('position').notNull(),
  isLate: integer('is_late', { mode: 'boolean' }).notNull().default(false),
})

export type ItineraryWorkOrderTable = InferSelectModel<
  typeof itineraryWorkOrder
>
export type NewItineraryWorkOrderTable = InferInsertModel<
  typeof itineraryWorkOrder
>
