import { Product } from '@/src/domain/entities/product/product.entity'
import { category } from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import { InferSelectModel } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

type ProductModelShape = Pick<
  Product,
  'id' | 'name' | 'categoryId' | 'salePrice' | 'isActive'
> & {
  expiration: string
}

export const product = sqliteTable('product', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  name: text('name').notNull(),
  categoryId: text('category_id')
    .references(() => category.id)
    .notNull(),
  salePrice: real('sale_price').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  expiration: text('expiration').notNull(),
}) satisfies Record<keyof ProductModelShape, any>

export type ProductTable = InferSelectModel<typeof product>
