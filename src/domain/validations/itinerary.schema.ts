import { itinerary } from '@/src/infra/db/drizzle/schema'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

export const ItinerarySchemaWithoutId = {
  initialItineraryDate: z.iso.date('Data inicial do itinerário inválida'),
  finalItineraryDate: z.iso.date('Data final do itinerário inválida'),
  isFinished: z.boolean(),
}

export const ItinerarySchema = {
  id: () => z.uuid('UUID inválido'),
  ...ItinerarySchemaWithoutId,
}

export const ItinerarySelectSchema = createSelectSchema(
  itinerary,
  ItinerarySchema
)

export type ItinerarySelectDTO = z.infer<typeof ItinerarySelectSchema>

export const ItineraryInsertSchema = createInsertSchema(
  itinerary,
  ItinerarySchemaWithoutId
)

export type ItineraryInsertDTO = z.infer<typeof ItineraryInsertSchema>

export const ItineraryUpdateSchema = createUpdateSchema(
  itinerary,
  ItinerarySchemaWithoutId
)

export type ItineraryUpdateDTO = z.infer<typeof ItineraryUpdateSchema>
