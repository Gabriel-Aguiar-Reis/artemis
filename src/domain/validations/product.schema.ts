import { product } from '@/src/infra/db/drizzle/schema'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

const NAME_CONSTRAINT_MESSAGE =
  'O nome do produto deve ter no mínimo 2 caracteres'

const NON_NEGATIVE_PRICE_MESSAGE = 'O preço de venda não pode ser negativo'
const NON_OPTIONAL_PRICE_MESSAGE = 'O preço de venda é obrigatório'

const EXPIRATION_REGEX = /^\d+\s*(month|year|week|day)s?$/i
const INVALID_EXPIRATION_MESSAGE = 'Formato de expiração inválido'

export const productSelectSchema = createSelectSchema(product, {
  name: (schema) => schema.min(2, NAME_CONSTRAINT_MESSAGE),
  salePrice: (schema) => schema.nonnegative(NON_NEGATIVE_PRICE_MESSAGE),
  isActive: (schema) => schema.optional(),
  categoryId: () => z.uuid(),
  expiration: () =>
    z.string().regex(EXPIRATION_REGEX, INVALID_EXPIRATION_MESSAGE),
})

export type ProductSelectDTO = z.infer<typeof productSelectSchema>

export const productInsertSchema = createInsertSchema(product, {
  name: (schema) => schema.min(2, NAME_CONSTRAINT_MESSAGE),
  salePrice: (schema) =>
    schema
      .refine((val) => val !== 0, { message: NON_OPTIONAL_PRICE_MESSAGE })
      .nonnegative(NON_NEGATIVE_PRICE_MESSAGE),
  isActive: (schema) => schema.optional(),
  categoryId: () => z.uuid('UUID inválido'),
  expiration: () =>
    z.string().regex(EXPIRATION_REGEX, INVALID_EXPIRATION_MESSAGE),
})

export type ProductInsertDTO = z.infer<typeof productInsertSchema>

export const productUpdateSchema = createUpdateSchema(product, {
  name: (schema) => schema.min(2, NAME_CONSTRAINT_MESSAGE).optional(),
  isActive: (schema) => schema.optional(),
  salePrice: (schema) =>
    schema.nonnegative(NON_NEGATIVE_PRICE_MESSAGE).optional(),
  categoryId: () => z.uuid().optional(),
  expiration: () =>
    z.string().regex(EXPIRATION_REGEX, INVALID_EXPIRATION_MESSAGE).optional(),
})

export type ProductUpdateDTO = z.infer<typeof productUpdateSchema>
