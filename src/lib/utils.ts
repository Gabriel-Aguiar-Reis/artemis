import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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

export const PERIODS = [
  { nome: 'dias', range: Array.from({ length: 31 }, (_, i) => i + 1) },
  { nome: 'semanas', range: Array.from({ length: 4 }, (_, i) => i + 1) },
  { nome: 'meses', range: Array.from({ length: 100 }, (_, i) => i + 1) },
  { nome: 'anos', range: Array.from({ length: 20 }, (_, i) => i + 1) },
]
