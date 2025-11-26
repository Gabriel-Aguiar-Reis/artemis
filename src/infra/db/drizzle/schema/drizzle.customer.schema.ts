import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { InferSelectModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

export type CustomerModelShape = Pick<
  Customer,
  'id' | 'storeName' | 'contactName'
> & {
  phoneNumber: string
  phoneIsWhatsApp: boolean
  landlineNumber: string | null
  landlineIsWhatsApp: boolean | null
  addressStreetName: string
  addressStreetNumber: number
  addressNeighborhood: string
  addressCity: string
  addressState: string
  addressZipCode: string
}

export const customer = sqliteTable('customer', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  storeName: text('store_name').notNull(),
  contactName: text('contact_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  phoneIsWhatsApp: integer('phone_is_whatsapp', { mode: 'boolean' })
    .notNull()
    .default(false),
  landlineNumber: text('landline_number'),
  landlineIsWhatsApp: integer('landline_is_whatsapp', { mode: 'boolean' }),
  addressStreetName: text('address_street_name').notNull(),
  addressStreetNumber: integer('address_street_number').notNull(),
  addressNeighborhood: text('address_neighborhood').notNull(),
  addressCity: text('address_city').notNull(),
  addressState: text('address_state').notNull(),
  addressZipCode: text('address_zip_code').notNull(),
}) satisfies Record<keyof CustomerModelShape, any>

export type CustomerTable = InferSelectModel<typeof customer>
