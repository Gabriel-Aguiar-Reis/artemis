// Only `import type`: the entity imports this module, and a value import
// would create a cycle (the enum would still be undefined when this file is evaluated).
import type { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'

const S = {
  PENDING: 'PENDING',
  COMMITTED: 'COMMITTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  PARTIAL: 'PARTIAL',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  COPIED: 'COPIED',
} as Record<string, WorkOrderStatus>

/**
 * Work order business rules that used to be duplicated (and divergent) between
 * screens and entity. Pure functions: easy to test and to reuse in the
 * transactional repositories.
 */

/** Work orders that can still receive a report, enter an itinerary and be edited. */
export const OPEN_STATUSES: readonly WorkOrderStatus[] = [
  S.PENDING,
  S.COMMITTED,
  S.IN_PROGRESS,
]

/** Statuses that have already closed the work order: payment or itinerary do not change them. */
export const FINAL_STATUSES: readonly WorkOrderStatus[] = [
  S.COMPLETED,
  S.PARTIAL,
  S.FAILED,
  S.CANCELLED,
  S.EXPIRED,
  S.COPIED,
]

/** Statuses whose report can still be corrected (recalculates the status). */
export const RESULT_EDITABLE_STATUSES: readonly WorkOrderStatus[] = [
  S.COMPLETED,
  S.PARTIAL,
  S.FAILED,
]

export function isOpenStatus(status: string): boolean {
  return (OPEN_STATUSES as readonly string[]).includes(status)
}

export function isFinalStatus(status: string): boolean {
  return (FINAL_STATUSES as readonly string[]).includes(status)
}

export function isKnownStatus(status: string): status is WorkOrderStatus {
  return (Object.values(S) as string[]).includes(status)
}

export type ResultCounts = {
  /** Number of distinct products scheduled in the work order */
  scheduled: number
  exchanged: number
  added: number
  removed: number
}

/**
 * Resulting status of a visit report.
 * - nothing exchanged or added → FAILED
 * - anything collected, or fewer exchanges than scheduled products → PARTIAL
 * - otherwise → COMPLETED
 */
export function resolveResultStatus(c: ResultCounts): WorkOrderStatus {
  if (c.exchanged === 0 && c.added === 0) return S.FAILED
  if (c.removed > 0 || (c.scheduled > 0 && c.exchanged < c.scheduled))
    return S.PARTIAL
  return S.COMPLETED
}

/** Rounds to cents (avoids 0.1 + 0.2 = 0.30000000000000004). */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export type PricedItem = { quantity: number; priceSnapshot: number }

/** Report total: exchanged + added (collected ones do not count). */
export function computeResultTotal(
  exchanged: PricedItem[],
  added: PricedItem[]
): number {
  const sum = [...exchanged, ...added].reduce(
    (acc, i) => acc + roundMoney(i.priceSnapshot * i.quantity),
    0
  )
  return roundMoney(sum)
}

/**
 * Keeps isPaid and paidInstallments consistent:
 * - all installments paid ⇒ paid
 * - marked as paid ⇒ all installments paid
 */
export function normalizePaymentState(input: {
  installments: number
  paidInstallments: number
  isPaid: boolean
}): { installments: number; paidInstallments: number; isPaid: boolean } {
  const installments = Math.max(1, Math.trunc(input.installments) || 1)
  let paid = Math.min(
    installments,
    Math.max(0, Math.trunc(input.paidInstallments) || 0)
  )
  let isPaid = input.isPaid
  if (isPaid) paid = installments
  else if (paid === installments) isPaid = true
  return { installments, paidInstallments: paid, isPaid }
}
