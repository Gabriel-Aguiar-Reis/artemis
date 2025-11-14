import { Product } from '@/src/domain/entities/product/product.entity'
import { category } from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

type ProductModelShape = Pick<
  Product,
  'id' | 'name' | 'categoryId' | 'salePrice' | 'isActive'
> & {
  expiration: string
}

export const product = sqliteTable('product', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  categoryId: text('category_id')
    .references(() => category.id)
    .notNull(),
  salePrice: real('sale_price').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  expiration: text('expiration').notNull(),
}) satisfies Record<keyof ProductModelShape, any>

export type ProductTable = InferSelectModel<typeof product>
export type NewProductTable = InferInsertModel<typeof product>
