import { EXPIRATION_REGEX } from '@/src/domain/entities/product/value-objects/expiration.vo'
import { product } from '@/src/infra/db/drizzle/schema'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

const productSchemaWithoutId = {
  name: () =>
    z.string().min(2, 'O nome do produto deve ter no mínimo 2 caracteres'),
  salePrice: () => z.number().min(0, 'O preço de venda não pode ser negativo'),
  isActive: () => z.boolean().optional(),
  categoryId: () => z.uuid().optional(),
  expiration: () =>
    z.string().regex(EXPIRATION_REGEX, 'Formato de expiração inválido'),
}

const productSchema = {
  id: () => z.uuid('UUID inválido.'),
  ...productSchemaWithoutId,
}

export const productSelectSchema = createSelectSchema(product, productSchema)

export type ProductSelectDTO = z.infer<typeof productSelectSchema>

export const productInsertSchema = createInsertSchema(product, productSchema)

export type ProductInsertDTO = z.infer<typeof productInsertSchema>

export const productUpdateSchema = createUpdateSchema(
  product,
  productSchemaWithoutId
)

export type ProductUpdateDTO = z.infer<typeof productUpdateSchema>
