import { Itinerary } from '@/src/domain/entities/itinerary/itinerary.entity'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

type ItineraryModelShape = Pick<Itinerary, 'id' | 'isFinished'> & {
  initialItineraryDate: string
  finalItineraryDate: string
}

export const itinerary = sqliteTable('itinerary', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  initialItineraryDate: text('initial_itinerary_date').notNull(),
  finalItineraryDate: text('final_itinerary_date').notNull(),
  isFinished: integer('is_finished', { mode: 'boolean' })
    .notNull()
    .default(false),
}) satisfies Record<keyof ItineraryModelShape, any>

export type ItineraryTable = InferSelectModel<typeof itinerary>
export type NewItineraryTable = InferInsertModel<typeof itinerary>
