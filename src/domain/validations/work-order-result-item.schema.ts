import { WorkOrderResultItemType } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { workOrderResultItem } from '@/src/infra/db/drizzle/schema'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import z from 'zod'

const workOrderResultItemSchemaWithoutId = {
  resultId: () => z.uuid('UUID inválido'),
  productId: () => z.uuid('UUID inválido'),
  quantity: () => z.number().int('Quantidade inválida'),
  priceSnapshot: () => z.number('Preço inválido'),
  type: () => z.enum(WorkOrderResultItemType, 'Tipo inválido'),
  observation: () => z.string().max(255, 'Observação muito longa'),
}

export const workOrderResultItemSchema = {
  id: () => z.uuid('UUID inválido'),
  ...workOrderResultItemSchemaWithoutId,
}

const workOrderResultItemSelectSchema = createSelectSchema(
  workOrderResultItem,
  workOrderResultItemSchema
)

export type WorkOrderResultItemSelectDTO = z.infer<
  typeof workOrderResultItemSelectSchema
>

export const workOrderResultItemInsertSchema = createInsertSchema(
  workOrderResultItem,
  workOrderResultItemSchemaWithoutId
)

export type WorkOrderResultItemInsertDTO = z.infer<
  typeof workOrderResultItemInsertSchema
>

export const workOrderResultItemUpdateSchema = createInsertSchema(
  workOrderResultItem,
  workOrderResultItemSchemaWithoutId
)

export type WorkOrderResultItemUpdateDTO = z.infer<
  typeof workOrderResultItemUpdateSchema
>
