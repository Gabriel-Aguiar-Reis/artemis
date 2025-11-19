import { Category } from '@/src/domain/entities/category/category.entity'
import { InferSelectModel, sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

type CategoryModelShape = Pick<Category, 'id' | 'name' | 'isActive'>

export const category = sqliteTable('category', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
}) satisfies Record<keyof CategoryModelShape, any>

export type CategoryTable = InferSelectModel<typeof category>
