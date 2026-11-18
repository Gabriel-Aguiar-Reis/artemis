import { WorkOrderResultItemType } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import {
  isFinalStatus,
  resolveResultStatus,
} from '@/src/domain/entities/work-order/work-order-rules'
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import { paymentOrder } from '@/src/infra/db/drizzle/schema'
import { workOrderItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-item.schema'
import { workOrderResultItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result-item.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { eq, ExtractTablesWithRelations } from 'drizzle-orm'
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core'
import { SQLiteRunResult } from 'expo-sqlite'

export type AppTransaction = SQLiteTransaction<
  'sync',
  SQLiteRunResult,
  Record<string, unknown>,
  ExtractTablesWithRelations<Record<string, unknown>>
>

export class PaymentService {
  /**
   * Chamado quando um pagamento é vinculado ou atualizado.
   *
   * Pagamento quitado não decide sozinho o status da OS (antes forçava
   * COMPLETED, apagando PARTIAL/FAILED e "desclonando" OS COPIED):
   * - OS em status final: nada muda
   * - OS em aberto com relatório: recebe o status calculado do relatório
   * - OS em aberto sem relatório: nada muda (pagamento antecipado)
   *
   * Retorna o status final da OS.
   */
  // Síncrono de propósito: roda dentro de db.transaction, que no driver
  // expo-sqlite só é atômica com chamadas síncronas (.all/.run).
  static finalizePayment(
    tx: AppTransaction,
    paymentOrderId: string
  ): WorkOrderStatus {
    const [wo] = tx
      .select()
      .from(workOrder)
      .where(eq(workOrder.paymentOrderId, paymentOrderId))
      .limit(1)
      .all()

    if (!wo)
      throw new Error(
        'Ordem de serviço vinculada à ordem de pagamento não encontrada.'
      )

    const [po] = tx
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.id, paymentOrderId))
      .limit(1)
      .all()

    if (!po)
      throw new Error(
        'Ordem de pagamento não encontrada para a ordem de serviço.'
      )

    const current = wo.status as WorkOrderStatus
    if (!po.isPaid || isFinalStatus(current) || !wo.resultId) return current

    const resultItems = tx
      .select({ type: workOrderResultItem.type })
      .from(workOrderResultItem)
      .where(eq(workOrderResultItem.resultId, wo.resultId))
      .all()

    const scheduled = tx
      .select({ id: workOrderItem.id })
      .from(workOrderItem)
      .where(eq(workOrderItem.workOrderId, wo.id))
      .all()

    const countOf = (t: WorkOrderResultItemType) =>
      resultItems.filter((i) => i.type === t).length

    const status = resolveResultStatus({
      scheduled: scheduled.length,
      exchanged: countOf(WorkOrderResultItemType.EXCHANGED),
      added: countOf(WorkOrderResultItemType.ADDED),
      removed: countOf(WorkOrderResultItemType.REMOVED),
    })

    tx.update(workOrder)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(workOrder.id, wo.id))
      .run()

    return status
  }
}
