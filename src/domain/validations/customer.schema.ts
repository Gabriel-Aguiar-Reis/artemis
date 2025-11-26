import { customer } from '@/src/infra/db/drizzle/schema'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

const customerSchemaWithoutId = {
  storeName: () =>
    z
      .string()
      .min(2, 'O nome da loja deve ter no mínimo 2 caracteres.')
      .max(100, 'O nome da loja deve ter no máximo 100 caracteres.'),
  contactName: () =>
    z
      .string()
      .min(2, 'O nome do contato deve ter no mínimo 2 caracteres.')
      .max(100, 'O nome do contato deve ter no máximo 100 caracteres.'),
  phoneNumber: () =>
    z
      .string()
      .regex(
        /^\d{2}\s?\d{5}-?\d{4}$/,
        'O número de telefone deve ser no padrão XX XXXXX-XXXX.'
      )
      .optional(),
  phoneIsWhatsApp: () => z.boolean().optional(),
  landlineNumber: () =>
    z
      .string()
      .regex(
        /^\d{2}\s?\d{4}-?\d{4}$/,
        'O número de telefone fixo deve ser no padrão XX XXXX-XXXX.'
      )
      .optional(),
  landlineIsWhatsApp: () => z.boolean().optional(),
  addressStreetName: () =>
    z
      .string()
      .min(2, 'O nome da rua deve ter no mínimo 2 caracteres.')
      .max(100, 'O nome da rua deve ter no máximo 100 caracteres.'),
  addressStreetNumber: () =>
    z
      .string()
      .min(1, 'O número da rua deve ter no mínimo 1 caractere.')
      .max(10, 'O número da rua deve ter no máximo 10 caracteres.'),
  addressNeighborhood: () =>
    z
      .string()
      .min(2, 'O nome do bairro deve ter no mínimo 2 caracteres.')
      .max(100, 'O nome do bairro deve ter no máximo 100 caracteres.'),
  addressCity: () =>
    z
      .string()
      .min(2, 'O nome da cidade deve ter no mínimo 2 caracteres.')
      .max(100, 'O nome da cidade deve ter no máximo 100 caracteres.'),
  addressState: () =>
    z
      .string()
      .min(2, 'O nome do estado deve ter no mínimo 2 caracteres.')
      .max(100, 'O nome do estado deve ter no máximo 100 caracteres.'),
  addressZipCode: () =>
    z
      .string()
      .regex(
        /^[0-9]{5}-?[0-9]{3}$/,
        "CEP inválido. Deve conter 8 dígitos e o formato 'XXXXXXXX' ou 'XXXXX-XXX'."
      ),
}

const customerSchema = {
  ...customerSchemaWithoutId,
  id: () => z.uuid('UUID inválido'),
}

export const customerSelectSchema = createSelectSchema(customer, customerSchema)

export type CustomerSelectDTO = z.infer<typeof customerSelectSchema>

export const customerInsertSchema = createInsertSchema(customer, customerSchema)

export type CustomerInsertDTO = z.infer<typeof customerInsertSchema>

export const customerUpdateSchema = createUpdateSchema(
  customer,
  customerSchemaWithoutId
)

export type CustomerUpdateDTO = z.infer<typeof customerUpdateSchema>
