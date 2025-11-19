import { category } from '@/src/infra/db/drizzle/schema'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

const NAME_CONSTRAINT_MESSAGE =
  'O nome da categoria deve ter no mínimo 2 caracteres'

export const categorySelectSchema = createSelectSchema(category, {
  name: (schema) => schema.min(2, NAME_CONSTRAINT_MESSAGE),
})

export type CategorySelectDTO = z.infer<typeof categorySelectSchema>

export const categoryInsertSchema = createInsertSchema(category, {
  name: (schema) => schema.min(2, NAME_CONSTRAINT_MESSAGE),
  isActive: (schema) => schema.optional(),
})

export type CategoryInsertDTO = z.infer<typeof categoryInsertSchema>

export const categoryUpdateSchema = createUpdateSchema(category, {
  name: (schema) => schema.min(2, NAME_CONSTRAINT_MESSAGE),
  isActive: (schema) => schema.optional(),
})

export type CategoryUpdateDTO = z.infer<typeof categoryUpdateSchema>
