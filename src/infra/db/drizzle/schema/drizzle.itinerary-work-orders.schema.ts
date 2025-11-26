import { itinerary } from '@/src/infra/db/drizzle/schema/drizzle.itinerary.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

export const itineraryWorkOrders = sqliteTable('itinerary_work_orders', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  itineraryId: text('itinerary_id')
    .references(() => itinerary.id, { onDelete: 'cascade' })
    .notNull(),
  workOrderId: text('work_order_id')
    .references(() => workOrder.id)
    .notNull(),
  position: integer('position').notNull(),
  isLate: integer('is_late', { mode: 'boolean' }).notNull().default(false),
})

export type ItineraryWorkOrdersTable = InferSelectModel<
  typeof itineraryWorkOrders
>
export type NewItineraryWorkOrdersTable = InferInsertModel<
  typeof itineraryWorkOrders
>
