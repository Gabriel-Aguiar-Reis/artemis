import { itineraryWorkOrder } from '@/src/infra/db/drizzle/schema'
import { createSelectSchema } from 'drizzle-zod'
import z from 'zod'

const itineraryWorkOrderSchemaWithoutId = {
  itineraryId: () => z.uuid('UUID inválido'),
  workOrderId: () => z.uuid('UUID inválido'),
  position: () => z.number().int('Posição inválida'),
  isLate: () => z.boolean('Valor inválido para isLate'),
}

export const itineraryWorkOrderSchema = {
  id: () => z.uuid('UUID inválido'),
  ...itineraryWorkOrderSchemaWithoutId,
}

export const itineraryWorkOrderSelectSchema = createSelectSchema(
  itineraryWorkOrder,
  itineraryWorkOrderSchema
)

export type ItineraryWorkOrderSelectDTO = z.infer<
  typeof itineraryWorkOrderSelectSchema
>

export const itineraryWorkOrderInsertSchema = createSelectSchema(
  itineraryWorkOrder,
  itineraryWorkOrderSchemaWithoutId
)

export type ItineraryWorkOrderInsertDTO = z.infer<
  typeof itineraryWorkOrderInsertSchema
>

export const itineraryWorkOrderUpdateSchema = createSelectSchema(
  itineraryWorkOrder,
  itineraryWorkOrderSchemaWithoutId
)

export type ItineraryWorkOrderUpdateDTO = z.infer<
  typeof itineraryWorkOrderUpdateSchema
>
