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
   * Called when a payment is linked or updated.
   *
   * A settled payment does not decide the work order status on its own (it used to force
   * COMPLETED, wiping PARTIAL/FAILED and "un-cloning" COPIED work orders):
   * - work order in a final status: nothing changes
   * - open work order with report: receives the status computed from the report
   * - open work order without report: nothing changes (advance payment)
   *
   * Returns the work order's final status.
   */
  // Synchronous on purpose: runs inside db.transaction, which in the
  // expo-sqlite driver is only atomic with synchronous calls (.all/.run).
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
