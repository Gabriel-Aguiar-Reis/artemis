/**
 * Scheduled-date period filter for the work order list.
 *
 * Presets are stored as relative tokens ("this-month"), not as dates, so a
 * filter restored on another day still means what the user picked. Custom
 * ranges use local calendar days ("YYYY-MM-DD").
 */

export const PERIOD_PRESETS = [
  { value: 'today', label: 'Hoje' },
  { value: 'this-month', label: 'Este mês' },
  { value: 'last-month', label: 'Mês passado' },
  { value: 'last-3-months', label: 'Últimos 3 meses' },
] as const

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]['value']

export type PeriodParams = {
  scheduledPeriod?: string
  scheduledFrom?: string
  scheduledTo?: string
  /** Legacy single-day filter (persisted by older versions) */
  scheduledDate?: string
}

export type DateRange = { from?: Date; to?: Date }

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function isPeriodPreset(value?: string): value is PeriodPreset {
  return PERIOD_PRESETS.some((p) => p.value === value)
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1, 0, 0, 0, 0)
}

function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999)
}

/** Local calendar day as "YYYY-MM-DD" */
export function toDayString(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Parses "YYYY-MM-DD" as a local day; also accepts a full ISO timestamp */
export function parseDay(value?: string): Date | undefined {
  if (!value) return undefined
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export function presetRange(preset: PeriodPreset, now = new Date()): DateRange {
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'this-month':
      return { from: startOfMonth(y, m), to: endOfMonth(y, m) }
    case 'last-month':
      return { from: startOfMonth(y, m - 1), to: endOfMonth(y, m - 1) }
    case 'last-3-months':
      return { from: startOfMonth(y, m - 2), to: endOfMonth(y, m) }
  }
}

/** Resolves the period params into an inclusive range (undefined = no filter) */
export function resolveScheduledRange(
  params: PeriodParams,
  now = new Date()
): DateRange | undefined {
  if (isPeriodPreset(params.scheduledPeriod)) {
    return presetRange(params.scheduledPeriod, now)
  }
  const from = parseDay(params.scheduledFrom)
  const to = parseDay(params.scheduledTo)
  if (from || to) {
    return {
      from: from ? startOfDay(from) : undefined,
      to: to ? endOfDay(to) : undefined,
    }
  }
  if (params.scheduledDate) {
    const day =
      params.scheduledDate === 'today' ? now : parseDay(params.scheduledDate)
    if (day) return { from: startOfDay(day), to: endOfDay(day) }
  }
  return undefined
}

function formatDay(d: Date): string {
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Label for the active-filters chip */
export function describeScheduledPeriod(
  params: PeriodParams
): string | undefined {
  const preset = PERIOD_PRESETS.find((p) => p.value === params.scheduledPeriod)
  if (preset) return preset.label
  const from = parseDay(params.scheduledFrom)
  const to = parseDay(params.scheduledTo)
  if (from && to) return `${formatDay(from)} a ${formatDay(to)}`
  if (from) return `A partir de ${formatDay(from)}`
  if (to) return `Até ${formatDay(to)}`
  if (params.scheduledDate === 'today') return 'Hoje'
  const day = parseDay(params.scheduledDate)
  return day ? formatDay(day) : undefined
}

/** "2026-10" for the month of a date (local time) */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** "2026-10" → "Outubro 2026" */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}
