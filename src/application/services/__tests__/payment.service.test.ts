import { PaymentService } from '@/src/application/services/payment.service'
import { WorkOrderResultItemType } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import { beforeEach, describe, expect, it, vitest } from 'vitest'

/**
 * Fake transaction: each finished query (await on .where() or .limit())
 * consumes the next result in the queue, in the order the service queries.
 */
function createMockTx(queue: any[]) {
  // Synchronous expo-sqlite driver API: .all() / .run() execute immediately
  const next = () => (queue.length ? queue.shift() : [])
  const updates: any[] = []
  const tx: any = {
    updates,
    select: vitest.fn(() => tx),
    from: vitest.fn(() => tx),
    update: vitest.fn(() => tx),
    set: vitest.fn((values: any) => {
      updates.push(values)
      return tx
    }),
    where: vitest.fn(() => ({
      limit: vitest.fn(() => ({ all: vitest.fn(() => next()) })),
      all: vitest.fn(() => next()),
      run: vitest.fn(() => ({ changes: 1 })),
    })),
  }
  return tx
}

const wo = (over: Partial<Record<string, any>> = {}) => ({
  id: 'wo-1',
  customerId: 'c-1',
  paymentOrderId: 'p-1',
  resultId: 'r-1',
  status: WorkOrderStatus.PENDING,
  ...over,
})

describe('PaymentService.finalizePayment', () => {
  beforeEach(() => vitest.clearAllMocks())

  it('errors when the linked work order does not exist', async () => {
    const tx = createMockTx([[]])
    expect(() => PaymentService.finalizePayment(tx, 'p-1')).toThrow(
      'Ordem de serviço vinculada à ordem de pagamento não encontrada.'
    )
  })

  it('errors when the payment does not exist', async () => {
    const tx = createMockTx([[wo()], []])
    expect(() => PaymentService.finalizePayment(tx, 'p-1')).toThrow(
      'Ordem de pagamento não encontrada para a ordem de serviço.'
    )
  })

  it('does not change a work order in a final status (PARTIAL stays PARTIAL)', async () => {
    const tx = createMockTx([
      [wo({ status: WorkOrderStatus.PARTIAL })],
      [{ id: 'p-1', isPaid: true }],
    ])
    expect(PaymentService.finalizePayment(tx, 'p-1')).toBe(
      WorkOrderStatus.PARTIAL
    )
    expect(tx.updates).toHaveLength(0)
  })

  it('does not "un-clone" a COPIED work order', async () => {
    const tx = createMockTx([
      [wo({ status: WorkOrderStatus.COPIED })],
      [{ id: 'p-1', isPaid: true }],
    ])
    expect(PaymentService.finalizePayment(tx, 'p-1')).toBe(
      WorkOrderStatus.COPIED
    )
    expect(tx.updates).toHaveLength(0)
  })

  it('advance payment (without report) does not finish the work order', async () => {
    const tx = createMockTx([
      [wo({ resultId: null })],
      [{ id: 'p-1', isPaid: true }],
    ])
    expect(PaymentService.finalizePayment(tx, 'p-1')).toBe(
      WorkOrderStatus.PENDING
    )
    expect(tx.updates).toHaveLength(0)
  })

  it('unsettled payment does not change the work order', async () => {
    const tx = createMockTx([[wo()], [{ id: 'p-1', isPaid: false }]])
    expect(PaymentService.finalizePayment(tx, 'p-1')).toBe(
      WorkOrderStatus.PENDING
    )
    expect(tx.updates).toHaveLength(0)
  })

  it('open work order with report receives the report status', async () => {
    const tx = createMockTx([
      [wo()],
      [{ id: 'p-1', isPaid: true }],
      [
        { type: WorkOrderResultItemType.EXCHANGED },
        { type: WorkOrderResultItemType.REMOVED },
      ],
      [{ id: 'i-1' }],
    ])
    expect(PaymentService.finalizePayment(tx, 'p-1')).toBe(
      WorkOrderStatus.PARTIAL
    )
    expect(tx.updates[0].status).toBe(WorkOrderStatus.PARTIAL)
  })

  it('open work order with a complete report becomes COMPLETED', async () => {
    const tx = createMockTx([
      [wo()],
      [{ id: 'p-1', isPaid: true }],
      [{ type: WorkOrderResultItemType.EXCHANGED }],
      [{ id: 'i-1' }],
    ])
    expect(PaymentService.finalizePayment(tx, 'p-1')).toBe(
      WorkOrderStatus.COMPLETED
    )
  })
})
