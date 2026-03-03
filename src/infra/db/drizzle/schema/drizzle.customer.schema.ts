import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { InferSelectModel } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

export type CustomerModelShape = Pick<
  Customer,
  'id' | 'storeName' | 'contactName'
> & {
  phoneNumber: string | null
  phoneIsWhatsApp: boolean | null
  landlineNumber: string | null
  landlineIsWhatsApp: boolean | null
  addressStreetName: string
  addressStreetNumber: string
  addressNeighborhood: string
  addressCity: string
  addressState: string
  addressZipCode: string
}

export const customer = sqliteTable(
  'customer',
  {
    id: text('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => String(uuid.v4())),
    storeName: text('store_name').notNull(),
    contactName: text('contact_name').notNull(),
    phoneNumber: text('phone_number'),
    phoneIsWhatsApp: integer('phone_is_whatsapp', { mode: 'boolean' }),
    landlineNumber: text('landline_number'),
    landlineIsWhatsApp: integer('landline_is_whatsapp', { mode: 'boolean' }),
    addressStreetName: text('address_street_name').notNull(),
    addressStreetNumber: text('address_street_number').notNull(),
    addressNeighborhood: text('address_neighborhood').notNull(),
    addressCity: text('address_city').notNull(),
    addressState: text('address_state').notNull(),
    addressZipCode: text('address_zip_code').notNull(),
  },
  (table) => ({
    storeNameIdx: index('idx_customer_store_name').on(table.storeName),
    contactNameIdx: index('idx_customer_contact_name').on(table.contactName),
    phoneNumberIdx: index('idx_customer_phone_number').on(table.phoneNumber),
    landlineNumberIdx: index('idx_customer_landline_number').on(
      table.landlineNumber
    ),
  })
) satisfies Record<keyof CustomerModelShape, any>

export type CustomerTable = InferSelectModel<typeof customer>
