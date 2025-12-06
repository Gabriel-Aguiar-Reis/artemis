import { Category } from '@/src/domain/entities/category/category.entity'
import { InferSelectModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

type CategoryModelShape = Pick<Category, 'id' | 'name' | 'isActive'>

export const category = sqliteTable('category', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  name: text('name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
}) satisfies Record<keyof CategoryModelShape, any>

export type CategoryTable = InferSelectModel<typeof category>
