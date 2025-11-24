import { customer } from '@/src/infra/db/drizzle/schema'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

export const customerSelectSchema = createSelectSchema(customer, {
  id: () => z.uuid('UUID inválido'),
  storeName: () => z.string().min(2).max(100),
  contactName: () => z.string().min(2).max(100),
  phoneNumber: () => z.string().min(10).max(15),
  phoneIsWhatsApp: () => z.boolean(),
  landlineNumber: () => z.string().min(10).max(15).nullable(),
  landlineIsWhatsApp: () => z.boolean(),
  addressStreetName: () => z.string().min(2).max(100),
  addressStreetNumber: () => z.string().min(1).max(10),
  addressNeighborhood: () => z.string().min(2).max(100),
  addressCity: () => z.string().min(2).max(100),
  addressState: () => z.string().min(2).max(100),
  addressZipCode: () => z.string().min(5).max(10),
})

export type CustomerSelectDTO = z.infer<typeof customerSelectSchema>

export const customerInsertSchema = createInsertSchema(customer, {
  storeName: () => z.string().min(2).max(100),
  contactName: () => z.string().min(2).max(100),
  phoneNumber: () => z.string().min(10).max(15),
  phoneIsWhatsApp: () => z.boolean(),
  landlineNumber: () => z.string().min(10).max(15).nullable(),
  landlineIsWhatsApp: () => z.boolean().nullable(),
  addressStreetName: () => z.string().min(2).max(100),
  addressStreetNumber: () => z.string().min(1).max(10),
  addressNeighborhood: () => z.string().min(2).max(100),
  addressCity: () => z.string().min(2).max(100),
  addressState: () => z.string().min(2).max(100),
  addressZipCode: () => z.string().min(5).max(10),
})

export type CustomerInsertDTO = z.infer<typeof customerInsertSchema>

export const customerUpdateSchema = createUpdateSchema(customer, {
  storeName: () => z.string().min(2).max(100),
  contactName: () => z.string().min(2).max(100),
  phoneNumber: () => z.string().min(10).max(15),
  phoneIsWhatsApp: () => z.boolean(),
  landlineNumber: () => z.string().min(10).max(15).nullable(),
  landlineIsWhatsApp: () => z.boolean().nullable(),
  addressStreetName: () => z.string().min(2).max(100),
  addressStreetNumber: () => z.string().min(1).max(10),
  addressNeighborhood: () => z.string().min(2).max(100),
  addressCity: () => z.string().min(2).max(100),
  addressState: () => z.string().min(2).max(100),
  addressZipCode: () => z.string().min(5).max(10),
})

export type CustomerUpdateDTO = z.infer<typeof customerUpdateSchema>
