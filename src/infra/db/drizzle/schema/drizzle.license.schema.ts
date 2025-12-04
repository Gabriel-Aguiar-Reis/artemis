import { License } from '@/src/domain/entities/license/license.entity'
import { InferSelectModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

export type LicenseModelShape = Pick<
  License,
  'id' | 'uniqueCode' | 'isAdmin'
> & {
  expirationDate: string // YYYY-MM-DD
  createdAt: string // ISO string
}

export const license = sqliteTable('license', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  uniqueCode: text('unique_code').notNull().unique(),
  expirationDate: text('expiration_date').notNull(), // YYYY-MM-DD
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}) satisfies Record<keyof LicenseModelShape, any>

export type LicenseTable = InferSelectModel<typeof license>
