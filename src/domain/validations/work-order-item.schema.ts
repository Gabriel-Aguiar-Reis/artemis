import { workOrderItem } from '@/src/infra/db/drizzle/schema'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

const workOrderItemSchemaWithoutId = {
  workOrderId: () => z.uuid('UUID inválido'),
  productId: () => z.uuid('UUID inválido'),
  quantity: () =>
    z
      .number()
      .int('Quantidade inválida')
      .min(1, 'A quantidade deve ser ao menos 1'),
  priceSnapshot: () =>
    z.number('Preço inválido').min(0, 'O preço não pode ser negativo'),
}

export const workOrderItemSchema = {
  id: () => z.uuid('UUID inválido'),
  ...workOrderItemSchemaWithoutId,
}

export const workOrderItemSelectSchema = createSelectSchema(
  workOrderItem,
  workOrderItemSchema
)

export type WorkOrderItemSelectDTO = z.infer<typeof workOrderItemSelectSchema>

export const workOrderItemInsertSchema = createInsertSchema(
  workOrderItem,
  workOrderItemSchemaWithoutId
)

export type WorkOrderItemInsertDTO = z.infer<typeof workOrderItemInsertSchema>

export const workOrderItemUpdateSchema = createUpdateSchema(
  workOrderItem,
  workOrderItemSchemaWithoutId
)

export type WorkOrderItemUpdateDTO = z.infer<typeof workOrderItemUpdateSchema>
