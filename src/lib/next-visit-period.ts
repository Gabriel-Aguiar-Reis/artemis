/**
 * Next-visit reminder filter for the work order list.
 *
 * Unlike the scheduled period, the interesting ranges look forward ("next
 * month", "next year") and "overdue" finds the reminders nobody acted on.
 * Presets are stored as relative tokens, like the scheduled period.
 */
import {
  DateRange,
  endOfDay,
  endOfMonth,
  formatDay,
  parseDay,
  startOfDay,
  startOfMonth,
} from '@/src/lib/work-order-period'

export const NEXT_VISIT_PRESETS = [
  { value: 'overdue', label: 'Vencidas' },
  { value: 'this-month', label: 'Este mês' },
  { value: 'next-month', label: 'Mês que vem' },
  { value: 'next-3-months', label: 'Próximos 3 meses' },
  { value: 'next-year', label: 'Ano que vem' },
] as const

export type NextVisitPreset = (typeof NEXT_VISIT_PRESETS)[number]['value']

export type NextVisitParams = {
  nextVisitPeriod?: string
  nextVisitFrom?: string
  nextVisitTo?: string
}

export function isNextVisitPreset(value?: string): value is NextVisitPreset {
  return NEXT_VISIT_PRESETS.some((p) => p.value === value)
}

export function nextVisitPresetRange(
  preset: NextVisitPreset,
  now = new Date()
): DateRange {
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (preset) {
    case 'overdue':
      return { to: endOfDay(new Date(y, m, now.getDate() - 1)) }
    case 'this-month':
      return { from: startOfMonth(y, m), to: endOfMonth(y, m) }
    case 'next-month':
      return { from: startOfMonth(y, m + 1), to: endOfMonth(y, m + 1) }
    case 'next-3-months':
      return { from: startOfMonth(y, m + 1), to: endOfMonth(y, m + 3) }
    case 'next-year':
      return { from: startOfMonth(y + 1, 0), to: endOfMonth(y + 1, 11) }
  }
}

/** Resolves the next-visit params into an inclusive range (undefined = no filter) */
export function resolveNextVisitRange(
  params: NextVisitParams,
  now = new Date()
): DateRange | undefined {
  if (isNextVisitPreset(params.nextVisitPeriod)) {
    return nextVisitPresetRange(params.nextVisitPeriod, now)
  }
  const from = parseDay(params.nextVisitFrom)
  const to = parseDay(params.nextVisitTo)
  if (from || to) {
    return {
      from: from ? startOfDay(from) : undefined,
      to: to ? endOfDay(to) : undefined,
    }
  }
  return undefined
}

/**
 * Filtering by next visit turns the list into an agenda: ordered by the
 * reminder, soonest first, and grouped by its month.
 */
export function isNextVisitView(filters?: {
  nextVisitFrom?: string
  nextVisitTo?: string
  hasNextVisit?: string
}): boolean {
  return (
    !!filters?.nextVisitFrom ||
    !!filters?.nextVisitTo ||
    filters?.hasNextVisit === 'true'
  )
}

/** Label for the active-filters chip */
export function describeNextVisitPeriod(
  params: NextVisitParams
): string | undefined {
  const preset = NEXT_VISIT_PRESETS.find(
    (p) => p.value === params.nextVisitPeriod
  )
  if (preset) return preset.label
  const from = parseDay(params.nextVisitFrom)
  const to = parseDay(params.nextVisitTo)
  if (from && to) return `${formatDay(from)} a ${formatDay(to)}`
  if (from) return `A partir de ${formatDay(from)}`
  if (to) return `Até ${formatDay(to)}`
  return undefined
}
