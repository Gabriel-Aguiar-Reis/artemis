import { category } from '@/src/infra/db/drizzle/schema'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

const categorySchemaWithoutId = {
  name: () =>
    z.string().min(2, 'O nome da categoria deve ter no mínimo 2 caracteres.'),
  isActive: () => z.boolean().optional(),
}

const categorySchema = {
  id: () => z.uuid('UUID inválido.'),
  ...categorySchemaWithoutId,
}

export const categorySelectSchema = createSelectSchema(category, categorySchema)

export type CategorySelectDTO = z.infer<typeof categorySelectSchema>

export const categoryInsertSchema = createInsertSchema(category, categorySchema)

export type CategoryInsertDTO = z.infer<typeof categoryInsertSchema>

export const categoryUpdateSchema = createUpdateSchema(
  category,
  categorySchemaWithoutId
)

export type CategoryUpdateDTO = z.infer<typeof categoryUpdateSchema>
