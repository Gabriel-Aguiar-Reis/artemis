import { paymentOrder } from '@/src/infra/db/drizzle/schema'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

const paymentOrderSchemaWithoutId = {
  method: z.string().min(1, 'O método de pagamento é obrigatório.'),
  totalValue: z
    .number()
    .min(0, 'O valor total deve ser maior ou igual a zero.'),
  installments: z
    .number()
    .min(1, 'O número de parcelas deve ser pelo menos 1.'),
  isPaid: z.boolean().default(false).optional(),
  paidInstallments: z
    .number()
    .min(0, 'O número de parcelas pagas deve ser pelo menos 0.'),
}

const paymentOrderSchema = {
  id: z.uuid('UUID inválido.'),
  ...paymentOrderSchemaWithoutId,
}

export const paymentOrderSelectSchema = createSelectSchema(
  paymentOrder,
  paymentOrderSchema
)

export type PaymentOrderSelectDTO = z.infer<typeof paymentOrderSelectSchema>

export const paymentOrderInsertSchema = createInsertSchema(
  paymentOrder,
  paymentOrderSchemaWithoutId
)

export type PaymentOrderInsertDTO = z.infer<typeof paymentOrderInsertSchema>

export const paymentOrderUpdateSchema = createUpdateSchema(
  paymentOrder,
  paymentOrderSchemaWithoutId
)

export type PaymentOrderUpdateDTO = z.infer<typeof paymentOrderUpdateSchema>
