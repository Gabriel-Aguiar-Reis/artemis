import { workOrderResult } from '@/src/infra/db/drizzle/schema'
import { createSelectSchema } from 'drizzle-zod'
import z from 'zod'

const workOrderResultSchemaWithoutId = {
  totalValue: () => z.number().min(0, 'O valor total não pode ser negativo'),
}

const workOrderResultSchema = {
  id: () => z.uuid('UUID inválido.'),
  ...workOrderResultSchemaWithoutId,
}
export const workOrderResultSelectSchema = createSelectSchema(
  workOrderResult,
  workOrderResultSchema
)

export type WorkOrderResultSelectDTO = z.infer<typeof workOrderResultSchema>

export const workOrderResultInsertSchema = createSelectSchema(
  workOrderResult,
  workOrderResultSchemaWithoutId
)

export type WorkOrderResultInsertDTO = z.infer<
  typeof workOrderResultInsertSchema
>

export const workOrderResultUpdateSchema = createSelectSchema(
  workOrderResult,
  workOrderResultSchemaWithoutId
)

export type WorkOrderResultUpdateDTO = z.infer<
  typeof workOrderResultUpdateSchema
>
