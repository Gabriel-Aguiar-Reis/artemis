import { clsx, type ClassValue } from 'clsx'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { twMerge } from 'tailwind-merge'

export type UUID = `${string}-${string}-${string}-${string}-${string}`

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeString(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function smartSearch(haystack: string, needle: string) {
  return normalizeString(haystack).includes(normalizeString(needle))
}

export function getErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined
  if (typeof err === 'string') return err
  if (typeof err === 'object' && 'message' in err) {
    const msg = (err as any).message
    return typeof msg === 'string' ? msg : undefined
  }
  return undefined
}

/**
 * Normalizes a Brazilian phone number by removing the country code (55) if present.
 * Accepts numbers in the formats:
 * - With country code: 5512981234567 (mobile) or 551234567890 (landline)
 * - Without country code: 12981234567 (mobile) or 1234567890 (landline)
 * - With formatting: (12) 98123-4567, +55 12 98123-4567, etc.
 *
 * @param raw - Phone number in any format
 * @returns Normalized number containing only area code + number (without country code)
 */
export function normalizePhoneBrazil(raw?: string): string {
  if (!raw) return ''

  // Remove all non-numeric characters
  const digitsOnly = raw.replace(/\D/g, '')

  // If it starts with 55 and has 13 digits (mobile) or 12 digits (landline), remove the country code
  if (digitsOnly.startsWith('55')) {
    const withoutCountryCode = digitsOnly.slice(2)
    // Mobile has 11 digits (2-digit area code + 9 digits)
    // Landline has 10 digits (2-digit area code + 8 digits)
    if (withoutCountryCode.length === 11 || withoutCountryCode.length === 10) {
      return withoutCountryCode
    }
  }

  // Return the number as is (digits only)
  return digitsOnly
}

export function formatPhoneBrazil(raw?: string) {
  const fallback = raw ?? ''
  try {
    if (!raw) return fallback
    const parsed = parsePhoneNumberFromString(raw, 'BR')
    if (!parsed || !parsed.isValid()) return raw
    return parsed.formatNational()
  } catch (e) {
    return fallback
  }
}

export const PERIODS = [
  { nome: 'dias', range: Array.from({ length: 31 }, (_, i) => i + 1) },
  { nome: 'semanas', range: Array.from({ length: 4 }, (_, i) => i + 1) },
  { nome: 'meses', range: Array.from({ length: 100 }, (_, i) => i + 1) },
  { nome: 'anos', range: Array.from({ length: 20 }, (_, i) => i + 1) },
]
