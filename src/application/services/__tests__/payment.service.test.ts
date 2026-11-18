import { PaymentService } from '@/src/application/services/payment.service'
import { WorkOrderResultItemType } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import { beforeEach, describe, expect, it, vitest } from 'vitest'

/**
 * Transação falsa: cada consulta terminada (await em .where() ou .limit())
 * consome o próximo resultado da fila, na ordem em que o serviço consulta.
 */
function createMockTx(queue: any[]) {
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
    where: vitest.fn(() => {
      const thenable: any = {
        limit: vitest.fn(() => Promise.resolve(next())),
        then: (res: any, rej: any) => Promise.resolve(next()).then(res, rej),
      }
      return thenable
    }),
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

  it('erro quando a OS vinculada não existe', async () => {
    const tx = createMockTx([[]])
    await expect(PaymentService.finalizePayment(tx, 'p-1')).rejects.toThrow(
      'Ordem de serviço vinculada à ordem de pagamento não encontrada.'
    )
  })

  it('erro quando o pagamento não existe', async () => {
    const tx = createMockTx([[wo()], []])
    await expect(PaymentService.finalizePayment(tx, 'p-1')).rejects.toThrow(
      'Ordem de pagamento não encontrada para a ordem de serviço.'
    )
  })

  it('não altera OS em status final (PARTIAL continua PARTIAL)', async () => {
    const tx = createMockTx([
      [wo({ status: WorkOrderStatus.PARTIAL })],
      [{ id: 'p-1', isPaid: true }],
    ])
    await expect(PaymentService.finalizePayment(tx, 'p-1')).resolves.toBe(
      WorkOrderStatus.PARTIAL
    )
    expect(tx.updates).toHaveLength(0)
  })

  it('não "desclona" OS COPIED', async () => {
    const tx = createMockTx([
      [wo({ status: WorkOrderStatus.COPIED })],
      [{ id: 'p-1', isPaid: true }],
    ])
    await expect(PaymentService.finalizePayment(tx, 'p-1')).resolves.toBe(
      WorkOrderStatus.COPIED
    )
    expect(tx.updates).toHaveLength(0)
  })

  it('pagamento antecipado (sem relatório) não finaliza a OS', async () => {
    const tx = createMockTx([
      [wo({ resultId: null })],
      [{ id: 'p-1', isPaid: true }],
    ])
    await expect(PaymentService.finalizePayment(tx, 'p-1')).resolves.toBe(
      WorkOrderStatus.PENDING
    )
    expect(tx.updates).toHaveLength(0)
  })

  it('pagamento não quitado não altera a OS', async () => {
    const tx = createMockTx([[wo()], [{ id: 'p-1', isPaid: false }]])
    await expect(PaymentService.finalizePayment(tx, 'p-1')).resolves.toBe(
      WorkOrderStatus.PENDING
    )
    expect(tx.updates).toHaveLength(0)
  })

  it('OS em aberto com relatório recebe o status do relatório', async () => {
    const tx = createMockTx([
      [wo()],
      [{ id: 'p-1', isPaid: true }],
      [
        { type: WorkOrderResultItemType.EXCHANGED },
        { type: WorkOrderResultItemType.REMOVED },
      ],
      [{ id: 'i-1' }],
    ])
    await expect(PaymentService.finalizePayment(tx, 'p-1')).resolves.toBe(
      WorkOrderStatus.PARTIAL
    )
    expect(tx.updates[0].status).toBe(WorkOrderStatus.PARTIAL)
  })

  it('OS em aberto com relatório completo vira COMPLETED', async () => {
    const tx = createMockTx([
      [wo()],
      [{ id: 'p-1', isPaid: true }],
      [{ type: WorkOrderResultItemType.EXCHANGED }],
      [{ id: 'i-1' }],
    ])
    await expect(PaymentService.finalizePayment(tx, 'p-1')).resolves.toBe(
      WorkOrderStatus.COMPLETED
    )
  })
})
