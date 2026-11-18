// Só `import type`: a entidade importa este módulo, e um import de valor
// criaria ciclo (o enum ainda estaria undefined na avaliação deste arquivo).
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
 * Regras de negócio da OS que antes estavam duplicadas (e divergentes) entre
 * telas e entidade. Funções puras: fáceis de testar e de reaproveitar nos
 * repositórios transacionais.
 */

/** OS que ainda podem receber relatório, entrar em itinerário e ser editadas. */
export const OPEN_STATUSES: readonly WorkOrderStatus[] = [
  S.PENDING,
  S.COMMITTED,
  S.IN_PROGRESS,
]

/** Status que já encerraram a OS: pagamento ou itinerário não os alteram. */
export const FINAL_STATUSES: readonly WorkOrderStatus[] = [
  S.COMPLETED,
  S.PARTIAL,
  S.FAILED,
  S.CANCELLED,
  S.EXPIRED,
  S.COPIED,
]

/** Status cujo relatório ainda pode ser corrigido (recalcula o status). */
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
  /** Quantidade de produtos distintos agendados na OS */
  scheduled: number
  exchanged: number
  added: number
  removed: number
}

/**
 * Status resultante de um relatório de visita.
 * - nada trocado nem adicionado → FAILED
 * - algo recolhido, ou menos trocas que produtos agendados → PARTIAL
 * - caso contrário → COMPLETED
 */
export function resolveResultStatus(c: ResultCounts): WorkOrderStatus {
  if (c.exchanged === 0 && c.added === 0) return S.FAILED
  if (c.removed > 0 || (c.scheduled > 0 && c.exchanged < c.scheduled))
    return S.PARTIAL
  return S.COMPLETED
}

/** Arredonda para centavos (evita 0.1 + 0.2 = 0.30000000000000004). */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export type PricedItem = { quantity: number; priceSnapshot: number }

/** Total do relatório: trocados + adicionados (recolhidos não somam). */
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
 * Mantém isPaid e paidInstallments coerentes:
 * - todas as parcelas pagas ⇒ pago
 * - marcado como pago ⇒ todas as parcelas pagas
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
