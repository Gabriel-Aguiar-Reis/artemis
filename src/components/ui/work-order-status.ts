import { WorkOrder, WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'

/**
 * Visual hierarchy for work order cards.
 *
 * Color is reserved for what needs attention, and its strength follows the
 * priority: neutral for the expected state, success once something is done,
 * warning/danger only when the user has to act. Informational flags (cloned,
 * expired) get a subtle badge but no colored border, so they don't compete
 * with actionable ones.
 */

export type PriorityStatus = {
  label: string
  /** Extra classes for the card container (border emphasis) */
  borderClass: string
  /** Lozenge background + text */
  badgeClass: string
  textClass: string
}

const lozenge = 'rounded-full px-2 py-0.5'

export function getPriorityStatus(
  wo: WorkOrder,
  isLate?: boolean
): PriorityStatus | null {
  // Priority order: CLONADA > S/ PGTO > EXPIRADA > ATRASADO
  if (wo.status === WorkOrderStatus.COPIED) {
    return {
      label: 'CLONADA',
      borderClass: '',
      badgeClass: `${lozenge} bg-info-subtle`,
      textClass: 'text-xs font-bold text-info',
    }
  }
  if (wo.result && !wo.paymentOrder) {
    return {
      label: 'S/ PGTO',
      borderClass: 'border-2 border-destructive',
      badgeClass: `${lozenge} bg-destructive-subtle`,
      textClass: 'text-xs font-bold text-destructive',
    }
  }
  if (wo.status === WorkOrderStatus.EXPIRED) {
    return {
      label: 'EXPIRADA',
      borderClass: '',
      badgeClass: `${lozenge} bg-muted`,
      textClass: 'text-xs font-bold text-muted-foreground',
    }
  }
  if (isLate) {
    return {
      label: 'ATRASADO',
      borderClass: 'border-2 border-warning',
      badgeClass: `${lozenge} bg-warning-subtle`,
      textClass: 'text-xs font-bold text-warning',
    }
  }
  return null
}

/** Visit line: done → success, not yet → neutral (expected for future orders) */
export function visitTone(wo: WorkOrder): string {
  return wo.visitDate ? 'text-success' : 'text-muted-foreground'
}

/** Report line: registered → success, missing → neutral */
export function reportTone(wo: WorkOrder): string {
  return wo.result ? 'font-semibold text-success' : 'text-muted-foreground'
}

/**
 * Payment line: paid → success; open payment, or a visit report without any
 * payment → warning (money to collect); nothing yet → neutral.
 */
export function paymentTone(wo: WorkOrder): string {
  if (wo.paymentOrder?.isPaid) return 'font-semibold text-success'
  if (wo.paymentOrder || wo.result) return 'text-warning'
  return 'text-muted-foreground'
}
