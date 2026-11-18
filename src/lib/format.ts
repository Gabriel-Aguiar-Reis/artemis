// Formatters em escopo de módulo: criar Intl.* é caro e as listas formatam
// centenas de valores por rolagem.

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateShortFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: 'numeric',
  year: '2-digit',
})

/** Ex.: 1234.5 -> "R$ 1.234,50" */
export function formatBRL(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return brlFormatter.format(n)
}

/** Ex.: "05/03/2026" */
export function formatDate(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return ''
  return dateFormatter.format(date)
}

/** Ex.: "qui., 5/3/26" (usado nos cards de OS) */
export function formatDateShort(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return ''
  return dateShortFormatter.format(date)
}
