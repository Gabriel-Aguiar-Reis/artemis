import { clsx, type ClassValue } from 'clsx'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { twMerge } from 'tailwind-merge'

export type UUID = `${string}-${string}-${string}-${string}-${string}`

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function normalizeString(str: string) {
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
 * Normaliza um número de telefone brasileiro removendo o código do país (55) se presente.
 * Aceita números nos formatos:
 * - Com código do país: 5512981234567 (celular) ou 551234567890 (fixo)
 * - Sem código do país: 12981234567 (celular) ou 1234567890 (fixo)
 * - Com formatação: (12) 98123-4567, +55 12 98123-4567, etc.
 *
 * @param raw - Número de telefone em qualquer formato
 * @returns Número normalizado contendo apenas DDD + número (sem código do país)
 */
export function normalizePhoneBrazil(raw?: string): string {
  if (!raw) return ''

  // Remove todos os caracteres não numéricos
  const digitsOnly = raw.replace(/\D/g, '')

  // Se começar com 55 e tiver 13 dígitos (celular) ou 12 dígitos (fixo), remove o código do país
  if (digitsOnly.startsWith('55')) {
    const withoutCountryCode = digitsOnly.slice(2)
    // Celular tem 11 dígitos (DDD 2 dígitos + 9 dígitos)
    // Fixo tem 10 dígitos (DDD 2 dígitos + 8 dígitos)
    if (withoutCountryCode.length === 11 || withoutCountryCode.length === 10) {
      return withoutCountryCode
    }
  }

  // Retorna o número como está (apenas dígitos)
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
