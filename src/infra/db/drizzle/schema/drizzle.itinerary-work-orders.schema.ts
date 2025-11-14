import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { itinerary } from './drizzle.itinerary.schema'
import { workOrder } from './drizzle.work-order.schema'

export const itineraryWorkOrders = sqliteTable('itinerary_work_orders', {
  id: text('id').primaryKey(),
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
