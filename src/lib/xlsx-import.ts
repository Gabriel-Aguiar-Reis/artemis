import { Expiration } from '@/src/domain/entities/product/value-objects/expiration.vo'
import { categoryInsertSchema } from '@/src/domain/validations/category.schema'
import { customerInsertSchema } from '@/src/domain/validations/customer.schema'
import { productInsertSchema } from '@/src/domain/validations/product.schema'
import { normalizePhoneBrazil, normalizeString } from '@/src/lib/utils'

/**
 * Pure functions for normalization, validation and deduplication of the .xlsx import.
 * Nothing here touches the database: the runner (application/import) handles persistence.
 */

export type ImportSheet = 'categorias' | 'produtos' | 'clientes'

export type RowIssue = {
  sheet: ImportSheet
  /** Row in the spreadsheet (1 = header, data starts at 2) */
  line: number
  reason: string
}

export type CategoryRow = { line: number; name: string; isActive: boolean }

export type ProductRow = {
  line: number
  name: string
  categoryName: string
  salePrice: number
  isActive: boolean
  expiration: string
}

export type CustomerRow = {
  line: number
  storeName: string
  contactName: string
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

export type Validated<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string }

// Valid UUID v4 only to satisfy the schema (the real id is generated on insert)
const DUMMY_ID = '00000000-0000-4000-8000-000000000000'

const cell = (row: unknown[], i: number): string => {
  const v = row[i]
  if (v === undefined || v === null) return ''
  return String(v).trim()
}

/** Canonical name key: no accents, lower case, collapsed spaces. */
export function nameKey(value: string): string {
  return normalizeString(value).replace(/\s+/g, ' ').trim()
}

/** "10,50", "R$ 10", "R$ 1.234,56", "10.5" or number -> number (or null). */
export function normalizePrice(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0
      ? Math.round(value * 100) / 100
      : null
  }
  let s = String(value ?? '')
    .replace(/R\$/gi, '')
    .replace(/\s+/g, '')
  if (s === '') return null
  if (s.includes(',')) {
    // BR format: dot = thousands, comma = decimal
    s = s.replace(/\./g, '').replace(',', '.')
  } else if ((s.match(/\./g) || []).length > 1) {
    // "1.234.567" -> thousands
    s = s.replace(/\./g, '')
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

/** ZIP code as an 8-digit string preserving the leading zero (Excel may deliver a number). */
export function normalizeZip(value: unknown): string {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits === '') return ''
  return digits.length < 8 ? digits.padStart(8, '0') : digits
}

/** Phone with digits only, without the 55 country code. */
export function normalizePhoneDigits(value: unknown): string {
  return normalizePhoneBrazil(String(value ?? ''))
}

export function parseBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  const s = nameKey(String(value ?? ''))
  if (s === '') return fallback
  if (['1', 'true', 'sim', 's', 'x', 'ativo'].includes(s)) return true
  if (['0', 'false', 'nao', 'n', 'inativo'].includes(s)) return false
  return fallback
}

const firstIssue = (error: {
  issues: { message: string; path: PropertyKey[] }[]
}) => {
  const i = error.issues[0]
  return i ? i.message : 'Dados inválidos.'
}

export function validateCategoryRow(
  row: unknown[],
  line: number
): Validated<CategoryRow> {
  const name = cell(row, 0).replace(/\s+/g, ' ')
  const isActive = parseBool(row[1], true)
  const parsed = categoryInsertSchema.safeParse({
    id: DUMMY_ID,
    name,
    isActive,
  })
  if (!parsed.success) return { ok: false, reason: firstIssue(parsed.error) }
  return { ok: true, value: { line, name, isActive } }
}

export function validateProductRow(
  row: unknown[],
  line: number
): Validated<ProductRow> {
  const name = cell(row, 0).replace(/\s+/g, ' ')
  const categoryName = cell(row, 1).replace(/\s+/g, ' ')
  if (!categoryName) return { ok: false, reason: 'Categoria não informada.' }

  const rawPrice = row[2]
  const emptyPrice = cell(row, 2) === ''
  const salePrice = emptyPrice ? 0 : normalizePrice(rawPrice)
  if (salePrice === null) {
    return { ok: false, reason: `Preço inválido: "${cell(row, 2)}".` }
  }
  const isActive = parseBool(row[3], true)

  let expiration = cell(row, 4)
  try {
    // Validates the format and normalizes singular/plural
    expiration = new Expiration(expiration).toDTO()
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : 'Validade inválida.',
    }
  }

  const parsed = productInsertSchema.safeParse({
    id: DUMMY_ID,
    name,
    salePrice: String(salePrice),
    isActive,
    expiration,
  })
  if (!parsed.success) return { ok: false, reason: firstIssue(parsed.error) }
  return {
    ok: true,
    value: { line, name, categoryName, salePrice, isActive, expiration },
  }
}

export function validateCustomerRow(
  row: unknown[],
  line: number,
  defaultState = 'SP'
): Validated<CustomerRow> {
  const phone = normalizePhoneDigits(row[2])
  const landline = normalizePhoneDigits(row[4])
  const value: CustomerRow = {
    line,
    storeName: cell(row, 0).replace(/\s+/g, ' '),
    contactName: cell(row, 1).replace(/\s+/g, ' '),
    phoneNumber: phone || null,
    phoneIsWhatsApp: phone ? parseBool(row[3]) : null,
    landlineNumber: landline || null,
    landlineIsWhatsApp: landline ? parseBool(row[5]) : null,
    addressStreetName: cell(row, 6),
    addressStreetNumber: cell(row, 7),
    addressNeighborhood: cell(row, 8),
    addressCity: cell(row, 9),
    addressState: defaultState,
    addressZipCode: normalizeZip(row[10]),
  }

  const parsed = customerInsertSchema.safeParse({
    id: DUMMY_ID,
    storeName: value.storeName,
    contactName: value.contactName,
    phoneNumber: value.phoneNumber ?? undefined,
    phoneIsWhatsApp: value.phoneIsWhatsApp ?? undefined,
    landlineNumber: value.landlineNumber ?? undefined,
    landlineIsWhatsApp: value.landlineIsWhatsApp ?? undefined,
    addressStreetName: value.addressStreetName,
    addressStreetNumber: value.addressStreetNumber,
    addressNeighborhood: value.addressNeighborhood,
    addressCity: value.addressCity,
    addressState: value.addressState,
    addressZipCode: value.addressZipCode,
  })
  if (!parsed.success) return { ok: false, reason: firstIssue(parsed.error) }
  return { ok: true, value }
}

/**
 * Customer duplicate keys: same establishment (normalized name)
 * with the same phone, OR with the same ZIP code + number. Two possible keys.
 */
export function customerDedupeKeys(c: {
  storeName: string
  phoneNumber: string | null
  addressZipCode: string
  addressStreetNumber: string
}): string[] {
  // Normalized on both sides: the database may hold "01234-567" or a
  // formatted phone while the sheet values are digits only
  const store = nameKey(c.storeName)
  const phone = c.phoneNumber ? normalizePhoneDigits(c.phoneNumber) : ''
  const zip = normalizeZip(c.addressZipCode)
  const keys: string[] = []
  if (phone) keys.push(`p|${store}|${phone}`)
  if (zip && c.addressStreetNumber) {
    keys.push(`a|${store}|${zip}|${nameKey(c.addressStreetNumber)}`)
  }
  return keys
}

/** Data rows of a sheet (drops the header and fully empty rows). */
export function dataRows(
  rows: unknown[][]
): Array<{ row: unknown[]; line: number }> {
  const out: Array<{ row: unknown[]; line: number }> = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every((c) => String(c ?? '').trim() === '')) continue
    out.push({ row, line: i + 1 })
  }
  return out
}
