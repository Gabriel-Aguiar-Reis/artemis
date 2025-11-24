import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import { workOrder } from '@/src/infra/db/drizzle/schema'

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

const NOTES_CONSTRAINT_MESSAGE =
  'As notas do pedido de serviço devem ter no máximo 500 caracteres'

export const workOrderSelectSchema = createSelectSchema(workOrder, {
  id: () => z.uuid('UUID inválido'),
  customerId: () => z.uuid('UUID inválido'),
  createdAt: () => z.date('Data de criação inválida'),
  updatedAt: () => z.date('Data de atualização inválida'),
  scheduledDate: () => z.date('Data agendada inválida'),
  visitDate: () => z.date('Data de visita inválida').nullable().optional(),
  paymentOrderId: () => z.uuid('UUID inválido').optional(),
  status: () => z.enum(Object.values(WorkOrderStatus)),
  resultId: () => z.uuid('UUID inválido').optional(),
  notes: (schema) => schema.max(500, NOTES_CONSTRAINT_MESSAGE).optional(),
})

export type WorkOrderSelectDTO = z.infer<typeof workOrderSelectSchema>

export const workOrderInsertSchema = createInsertSchema(workOrder, {
  customerId: () => z.uuid('UUID inválido'),
  scheduledDate: () => z.date('Data agendada inválida'),
  visitDate: () => z.date('Data de visita inválida').optional(),
  paymentOrderId: () => z.uuid('UUID inválido').optional(),
  status: () => z.enum(Object.values(WorkOrderStatus)).optional(),
  resultId: () => z.uuid('UUID inválido').optional(),
  notes: (schema) => schema.max(500, NOTES_CONSTRAINT_MESSAGE).optional(),
})

export type WorkOrderInsertDTO = z.infer<typeof workOrderInsertSchema>

export const workOrderUpdateSchema = createUpdateSchema(workOrder, {
  customerId: () => z.uuid('UUID inválido'),
  scheduledDate: () => z.date('Data agendada inválida'),
  visitDate: () => z.date('Data de visita inválida').optional(),
  paymentOrderId: () => z.uuid('UUID inválido').optional(),
  status: () => z.enum(Object.values(WorkOrderStatus)).optional(),
  resultId: () => z.uuid('UUID inválido').optional(),
  notes: (schema) => schema.max(500, NOTES_CONSTRAINT_MESSAGE).optional(),
})

export type WorkOrderUpdateDTO = z.infer<typeof workOrderUpdateSchema>
