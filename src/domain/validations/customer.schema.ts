import { customer } from '@/src/infra/db/drizzle/schema'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

const ADDRESS_ZIP_CODE_REGEX = /^[0-9]{5}-[0-9]{3}$/
const ADDRESS_ZIP_CODE_MESSAGE =
  "CEP inválido. Deve conter 8 dígitos e o formato 'XXXXX-XXX'."

const STORE_NAME_MIN_LENGTH_MESSAGE =
  'O nome da loja deve ter no mínimo 2 caracteres.'
const STORE_NAME_MAX_LENGTH_MESSAGE =
  'O nome da loja deve ter no máximo 100 caracteres.'

const CONTACT_NAME_MIN_LENGTH_MESSAGE =
  'O nome do contato deve ter no mínimo 2 caracteres.'
const CONTACT_NAME_MAX_LENGTH_MESSAGE =
  'O nome do contato deve ter no máximo 100 caracteres.'

const PHONE_NUMBER_REGEX = /^\+\d{1,3}\s\(\d{2}\)\s\d{4,5}-\d{4}$/
const PHONE_NUMBER_MESSAGE =
  'O número de telefone deve ser no padrão +XX (XX) XXXXX-XXXX.'

const LANDLINE_NUMBER_REGEX = /^\+\d{1,3}\s\(\d{2}\)\s\d{4}-\d{4}$/
const LANDLINE_NUMBER_MESSAGE =
  'O número de telefone fixo deve ser no padrão +XX (XX) XXXX-XXXX.'

const ADDRESS_STREET_NAME_MIN_LENGTH_MESSAGE =
  'O nome da rua deve ter no mínimo 2 caracteres.'
const ADDRESS_STREET_NAME_MAX_LENGTH_MESSAGE =
  'O nome da rua deve ter no máximo 100 caracteres.'

const ADDRESS_STREET_NUMBER_MIN_LENGTH_MESSAGE =
  'O número da rua deve ter no mínimo 1 caractere.'
const ADDRESS_STREET_NUMBER_MAX_LENGTH_MESSAGE =
  'O número da rua deve ter no máximo 10 caracteres.'

const ADDRESS_NEIGHBORHOOD_MIN_LENGTH_MESSAGE =
  'O nome do bairro deve ter no mínimo 2 caracteres.'
const ADDRESS_NEIGHBORHOOD_MAX_LENGTH_MESSAGE =
  'O nome do bairro deve ter no máximo 100 caracteres.'

const ADDRESS_CITY_MIN_LENGTH_MESSAGE =
  'O nome da cidade deve ter no mínimo 2 caracteres.'
const ADDRESS_CITY_MAX_LENGTH_MESSAGE =
  'O nome da cidade deve ter no máximo 100 caracteres.'

const ADDRESS_STATE_MIN_LENGTH_MESSAGE =
  'O nome do estado deve ter no mínimo 2 caracteres.'
const ADDRESS_STATE_MAX_LENGTH_MESSAGE =
  'O nome do estado deve ter no máximo 100 caracteres.'

export const customerSelectSchema = createSelectSchema(customer, {
  id: () => z.uuid('UUID inválido'),
  storeName: () =>
    z
      .string()
      .min(2, STORE_NAME_MIN_LENGTH_MESSAGE)
      .max(100, STORE_NAME_MAX_LENGTH_MESSAGE),
  contactName: () =>
    z
      .string()
      .min(2, CONTACT_NAME_MIN_LENGTH_MESSAGE)
      .max(100, CONTACT_NAME_MAX_LENGTH_MESSAGE),
  phoneNumber: () => z.string().regex(PHONE_NUMBER_REGEX, PHONE_NUMBER_MESSAGE),
  phoneIsWhatsApp: () => z.boolean(),
  landlineNumber: () =>
    z.string().regex(LANDLINE_NUMBER_REGEX, LANDLINE_NUMBER_MESSAGE).nullable(),
  landlineIsWhatsApp: () => z.boolean(),
  addressStreetName: () =>
    z
      .string()
      .min(2, ADDRESS_STREET_NAME_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_STREET_NAME_MAX_LENGTH_MESSAGE),
  addressStreetNumber: () =>
    z
      .string()
      .min(1, ADDRESS_STREET_NUMBER_MIN_LENGTH_MESSAGE)
      .max(10, ADDRESS_STREET_NUMBER_MAX_LENGTH_MESSAGE),
  addressNeighborhood: () =>
    z
      .string()
      .min(2, ADDRESS_NEIGHBORHOOD_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_NEIGHBORHOOD_MAX_LENGTH_MESSAGE),
  addressCity: () =>
    z
      .string()
      .min(2, ADDRESS_CITY_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_CITY_MAX_LENGTH_MESSAGE),
  addressState: () =>
    z
      .string()
      .min(2, ADDRESS_STATE_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_STATE_MAX_LENGTH_MESSAGE),
  addressZipCode: () =>
    z.string().regex(ADDRESS_ZIP_CODE_REGEX, ADDRESS_ZIP_CODE_MESSAGE),
})

export type CustomerSelectDTO = z.infer<typeof customerSelectSchema>

export const customerInsertSchema = createInsertSchema(customer, {
  storeName: () =>
    z
      .string()
      .min(2, STORE_NAME_MIN_LENGTH_MESSAGE)
      .max(100, STORE_NAME_MAX_LENGTH_MESSAGE),
  contactName: () =>
    z
      .string()
      .min(2, CONTACT_NAME_MIN_LENGTH_MESSAGE)
      .max(100, CONTACT_NAME_MAX_LENGTH_MESSAGE),
  phoneNumber: () => z.string().regex(PHONE_NUMBER_REGEX, PHONE_NUMBER_MESSAGE),
  phoneIsWhatsApp: () => z.boolean(),
  landlineNumber: () =>
    z.string().regex(LANDLINE_NUMBER_REGEX, LANDLINE_NUMBER_MESSAGE).nullable(),
  landlineIsWhatsApp: () => z.boolean(),
  addressStreetName: () =>
    z
      .string()
      .min(2, ADDRESS_STREET_NAME_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_STREET_NAME_MAX_LENGTH_MESSAGE),
  addressStreetNumber: () =>
    z
      .string()
      .min(1, ADDRESS_STREET_NUMBER_MIN_LENGTH_MESSAGE)
      .max(10, ADDRESS_STREET_NUMBER_MAX_LENGTH_MESSAGE),
  addressNeighborhood: () =>
    z
      .string()
      .min(2, ADDRESS_NEIGHBORHOOD_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_NEIGHBORHOOD_MAX_LENGTH_MESSAGE),
  addressCity: () =>
    z
      .string()
      .min(2, ADDRESS_CITY_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_CITY_MAX_LENGTH_MESSAGE),
  addressState: () =>
    z
      .string()
      .min(2, ADDRESS_STATE_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_STATE_MAX_LENGTH_MESSAGE),
  addressZipCode: () =>
    z.string().regex(ADDRESS_ZIP_CODE_REGEX, ADDRESS_ZIP_CODE_MESSAGE),
})

export type CustomerInsertDTO = z.infer<typeof customerInsertSchema>

export const customerUpdateSchema = createUpdateSchema(customer, {
  storeName: () =>
    z
      .string()
      .min(2, STORE_NAME_MIN_LENGTH_MESSAGE)
      .max(100, STORE_NAME_MAX_LENGTH_MESSAGE),
  contactName: () =>
    z
      .string()
      .min(2, CONTACT_NAME_MIN_LENGTH_MESSAGE)
      .max(100, CONTACT_NAME_MAX_LENGTH_MESSAGE),
  phoneNumber: () => z.string().regex(PHONE_NUMBER_REGEX, PHONE_NUMBER_MESSAGE),
  phoneIsWhatsApp: () => z.boolean(),
  landlineNumber: () =>
    z.string().regex(LANDLINE_NUMBER_REGEX, LANDLINE_NUMBER_MESSAGE).nullable(),
  landlineIsWhatsApp: () => z.boolean(),
  addressStreetName: () =>
    z
      .string()
      .min(2, ADDRESS_STREET_NAME_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_STREET_NAME_MAX_LENGTH_MESSAGE),
  addressStreetNumber: () =>
    z
      .string()
      .min(1, ADDRESS_STREET_NUMBER_MIN_LENGTH_MESSAGE)
      .max(10, ADDRESS_STREET_NUMBER_MAX_LENGTH_MESSAGE),
  addressNeighborhood: () =>
    z
      .string()
      .min(2, ADDRESS_NEIGHBORHOOD_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_NEIGHBORHOOD_MAX_LENGTH_MESSAGE),
  addressCity: () =>
    z
      .string()
      .min(2, ADDRESS_CITY_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_CITY_MAX_LENGTH_MESSAGE),
  addressState: () =>
    z
      .string()
      .min(2, ADDRESS_STATE_MIN_LENGTH_MESSAGE)
      .max(100, ADDRESS_STATE_MAX_LENGTH_MESSAGE),
  addressZipCode: () =>
    z.string().regex(ADDRESS_ZIP_CODE_REGEX, ADDRESS_ZIP_CODE_MESSAGE),
})

export type CustomerUpdateDTO = z.infer<typeof customerUpdateSchema>
