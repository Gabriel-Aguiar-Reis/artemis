import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import { workOrder } from '@/src/infra/db/drizzle/schema'

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

const workOrderSchemaWithoutId = {
  customerId: () => z.uuid('UUID inválido'),
  createdAt: () => z.date('Data de criação inválida'),
  updatedAt: () => z.date('Data de atualização inválida'),
  scheduledDate: () => z.date('Data agendada inválida'),
  visitDate: () => z.date('Data de visita inválida').nullable().optional(),
  paymentOrderId: () => z.uuid('UUID inválido').optional(),
  status: () => z.enum(Object.values(WorkOrderStatus)),
  resultId: () => z.uuid('UUID inválido').optional(),
  notes: () =>
    z
      .string()
      .max(
        500,
        'As notas do pedido de serviço devem ter no máximo 500 caracteres'
      )
      .optional(),
}

export const workOrderSchema = {
  id: () => z.uuid('UUID inválido'),
  ...workOrderSchemaWithoutId,
}

export const workOrderSelectSchema = createSelectSchema(
  workOrder,
  workOrderSchema
)

export type WorkOrderSelectDTO = z.infer<typeof workOrderSelectSchema>

export const workOrderInsertSchema = createInsertSchema(
  workOrder,
  workOrderSchemaWithoutId
)

export type WorkOrderInsertDTO = z.infer<typeof workOrderInsertSchema>

export const workOrderUpdateSchema = createUpdateSchema(
  workOrder,
  workOrderSchemaWithoutId
)

export type WorkOrderUpdateDTO = z.infer<typeof workOrderUpdateSchema>
