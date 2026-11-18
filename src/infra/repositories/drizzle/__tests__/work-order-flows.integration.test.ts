/**
 * Testes de integração com SQLite real (node:sqlite + driver drizzle
 * expo-sqlite). Cobrem os fluxos transacionais de OS, relatório e pagamento.
 */
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import { category } from '@/src/infra/db/drizzle/schema'
import DrizzlePaymentOrderRepository from '@/src/infra/repositories/drizzle/drizzle.payment-order.repository'
import DrizzleWorkOrderRepository from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'
import { UUID } from '@/src/lib/utils'
import { countRows, getTestDb, resetTestDb } from '@/src/test/sqlite-test-db'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/src/infra/db/drizzle/drizzle-client', async () =>
  (await import('@/src/test/sqlite-test-db')).drizzleClientMock()
)

const CAT = '00000000-0000-4000-8000-000000000001'
const P1 = '00000000-0000-4000-8000-0000000000a1'
const P2 = '00000000-0000-4000-8000-0000000000a2'
const CUST = '00000000-0000-4000-8000-0000000000c1'
const MISSING = '00000000-0000-4000-8000-0000000000ff'

function seed() {
  const { raw } = getTestDb()
  raw.exec(
    `INSERT INTO category (id, name, is_active) VALUES ('${CAT}', 'Bebidas', 1)`
  )
  raw.exec(
    `INSERT INTO product (id, name, category_id, sale_price, is_active, expiration)
     VALUES ('${P1}', 'Suco', '${CAT}', 10.1, 1, '6m'), ('${P2}', 'Água', '${CAT}', 0.2, 1, '1y')`
  )
  raw.exec(
    `INSERT INTO customer (id, store_name, contact_name, address_street_name, address_street_number,
       address_neighborhood, address_city, address_state, address_zip_code)
     VALUES ('${CUST}', 'Mercado Central', 'Ana', 'Rua A', 'S/N', 'Centro', 'Taubaté', 'SP', '12000000')`
  )
}

const repo = new DrizzleWorkOrderRepository()
const paymentRepo = new DrizzlePaymentOrderRepository()

const item = (productId: string, quantity: number, priceSnapshot: number) => ({
  productId,
  quantity,
  priceSnapshot,
})

function woRow(id: string) {
  return getTestDb()
    .raw.prepare('SELECT * FROM work_order WHERE id = ?')
    .get(id) as any
}

describe('driver expo-sqlite: semântica de transação', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  const NEW_CAT = '00000000-0000-4000-8000-000000000099'

  it('callback síncrono: erro no meio desfaz tudo (rollback)', () => {
    const { db } = getTestDb()
    expect(() =>
      db.transaction((tx) => {
        tx.insert(category).values({ id: NEW_CAT, name: 'X' }).run()
        throw new Error('falha no meio')
      })
    ).toThrow('falha no meio')
    expect(countRows('category')).toBe(1) // só a do seed
  })

  it('callback async NÃO é atômico neste driver (por isso o código usa síncrono)', async () => {
    const { db } = getTestDb()
    await expect(
      db.transaction(async (tx) => {
        await tx.insert(category).values({ id: NEW_CAT, name: 'X' })
        throw new Error('falha no meio')
      })
    ).rejects.toThrow('falha no meio')
    // o COMMIT já tinha rodado antes do await: o insert ficou gravado
    expect(countRows('category')).toBe(2)
  })
})

describe('addWorkOrderWithDetails', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('cria OS, itens, relatório e pagamento com status e totais corretos', async () => {
    const id = await repo.addWorkOrderWithDetails({
      customerId: CUST,
      scheduledDate: new Date('2026-11-20T12:00:00Z'),
      notes: 'entregar cedo',
      items: [item(P1, 2, 10.1), item(P2, 1, 0.2)],
      result: {
        exchanged: [item(P1, 2, 10.1)],
        added: [item(P2, 3, 0.1)],
        removed: [item(P2, 1, 0.2)],
      },
      payment: {
        method: 'PIX',
        totalValue: 20.5,
        installments: 3,
        isPaid: true,
      },
    })

    const wo = woRow(id)
    // trocou 1 de 2 agendados e recolheu 1 → PARTIAL
    expect(wo.status).toBe(WorkOrderStatus.PARTIAL)
    expect(wo.visit_date).toBeTruthy()
    expect(countRows('work_order_item')).toBe(2)
    expect(countRows('work_order_result_item')).toBe(3)

    const result = getTestDb()
      .raw.prepare('SELECT total_value FROM work_order_result')
      .get() as any
    expect(result.total_value).toBe(20.5) // 2×10,10 + 3×0,10 sem erro de float

    const po = getTestDb()
      .raw.prepare('SELECT * FROM payment_order')
      .get() as any
    expect(po.is_paid).toBe(1)
    expect(po.paid_installments).toBe(3)

    // hidratação em lote devolve o agregado completo
    const loaded = await repo.getWorkOrder(id as UUID)
    expect(loaded?.products).toHaveLength(2)
    expect(loaded?.result?.exchangedProducts).toHaveLength(1)
    expect(loaded?.result?.addedProducts).toHaveLength(1)
    expect(loaded?.result?.removedProducts).toHaveLength(1)
    expect(loaded?.customer.storeAddress.streetNumber).toBe('S/N')
  })

  it('é atômica: se um item falha, nada é gravado (sem relatório/pagamento órfãos)', async () => {
    await expect(
      repo.addWorkOrderWithDetails({
        customerId: CUST,
        scheduledDate: new Date(),
        items: [item(P1, 1, 10.1), item(MISSING, 1, 5)], // produto inexistente → FK
        result: { exchanged: [item(P1, 1, 10.1)], added: [], removed: [] },
        payment: {
          method: 'PIX',
          totalValue: 10.1,
          installments: 1,
          isPaid: false,
        },
      })
    ).rejects.toThrow()

    expect(countRows('work_order')).toBe(0)
    expect(countRows('work_order_item')).toBe(0)
    expect(countRows('work_order_result')).toBe(0)
    expect(countRows('work_order_result_item')).toBe(0)
    expect(countRows('payment_order')).toBe(0)
  })

  it('recusa quantidade fracionada ou zero antes de gravar', async () => {
    await expect(
      repo.addWorkOrderWithDetails({
        customerId: CUST,
        scheduledDate: new Date(),
        items: [item(P1, 1.5, 10.1)],
      })
    ).rejects.toThrow('número inteiro maior que zero')
    expect(countRows('work_order')).toBe(0)
  })
})

describe('relatório de visita', () => {
  let woId: UUID

  beforeEach(async () => {
    resetTestDb()
    seed()
    woId = await repo.addWorkOrderWithDetails({
      customerId: CUST,
      scheduledDate: new Date(),
      items: [item(P1, 1, 10.1)],
      payment: { method: 'PIX', totalValue: 0, installments: 1, isPaid: false },
    })
  })

  it('addResultToWorkOrder grava status do enum (nunca "completed" minúsculo) e sincroniza pagamento', async () => {
    await repo.addResultToWorkOrder(woId, {
      exchanged: [item(P1, 1, 10.1)],
      added: [],
      removed: [],
    })
    const wo = woRow(woId)
    expect(wo.status).toBe(WorkOrderStatus.COMPLETED)
    const po = getTestDb()
      .raw.prepare('SELECT total_value FROM payment_order WHERE id = ?')
      .get(wo.payment_order_id) as any
    expect(po.total_value).toBe(10.1)

    await expect(
      repo.addResultToWorkOrder(woId, { exchanged: [], added: [], removed: [] })
    ).rejects.toThrow('já possui relatório')
  })

  it('nada trocado nem adicionado vira FAILED', async () => {
    await repo.addResultToWorkOrder(woId, {
      exchanged: [],
      added: [],
      removed: [item(P1, 1, 10.1)],
    })
    expect(woRow(woId).status).toBe(WorkOrderStatus.FAILED)
  })

  it('updateWorkOrderResultItems recalcula status/total e é atômico', async () => {
    const resultId = await repo.addResultToWorkOrder(woId, {
      exchanged: [item(P1, 1, 10.1)],
      added: [],
      removed: [],
    })

    // falha no meio (produto inexistente): itens antigos continuam lá
    await expect(
      repo.updateWorkOrderResultItems(resultId, {
        exchanged: [item(MISSING, 1, 1)],
        added: [],
        removed: [],
      })
    ).rejects.toThrow()
    expect(countRows('work_order_result_item')).toBe(1)
    expect(woRow(woId).status).toBe(WorkOrderStatus.COMPLETED)

    // sucesso: agora recolheu → PARTIAL, total recalculado
    await repo.updateWorkOrderResultItems(resultId, {
      exchanged: [item(P1, 1, 10.1)],
      added: [item(P2, 2, 0.2)],
      removed: [item(P2, 1, 0.2)],
    })
    expect(woRow(woId).status).toBe(WorkOrderStatus.PARTIAL)
    const r = getTestDb()
      .raw.prepare('SELECT total_value FROM work_order_result WHERE id = ?')
      .get(resultId) as any
    expect(r.total_value).toBe(10.5)
  })

  it('não permite alterar relatório de OS já paga', async () => {
    const resultId = await repo.addResultToWorkOrder(woId, {
      exchanged: [item(P1, 1, 10.1)],
      added: [],
      removed: [],
    })
    const poId = woRow(woId).payment_order_id
    await paymentRepo.updatePaymentOrder({ id: poId, isPaid: true } as any)

    await expect(
      repo.updateWorkOrderResultItems(resultId, {
        exchanged: [],
        added: [],
        removed: [],
      })
    ).rejects.toThrow('já foi quitado')
  })
})

describe('pagamento', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('quitar o pagamento não transforma PARTIAL em COMPLETED e grava a data', async () => {
    const id = await repo.addWorkOrderWithDetails({
      customerId: CUST,
      scheduledDate: new Date(),
      items: [item(P1, 2, 10.1)],
      result: {
        exchanged: [item(P1, 1, 10.1)],
        added: [],
        removed: [item(P1, 1, 10.1)],
      },
      payment: {
        method: 'PIX',
        totalValue: 10.1,
        installments: 2,
        isPaid: false,
      },
    })
    expect(woRow(id).status).toBe(WorkOrderStatus.PARTIAL)

    const poId = woRow(id).payment_order_id
    await paymentRepo.updatePaymentOrder({
      id: poId,
      paidInstallments: '2',
      paymentDate: '2026-11-18T10:00:00.000Z',
    } as any)

    const po = getTestDb()
      .raw.prepare('SELECT * FROM payment_order WHERE id = ?')
      .get(poId) as any
    expect(po.is_paid).toBe(1) // 2 de 2 parcelas ⇒ pago
    expect(po.payment_date).toBe('2026-11-18T10:00:00.000Z')
    expect(woRow(id).status).toBe(WorkOrderStatus.PARTIAL)
  })
})

describe('listagem paginada', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('filtro por pago/valor não quebra o COUNT e a ordem é estável', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.addWorkOrderWithDetails({
        customerId: CUST,
        scheduledDate: new Date(2026, 10, 10 + i),
        items: [item(P1, 1, 10.1)],
        payment: {
          method: 'PIX',
          totalValue: 10 * (i + 1),
          installments: 1,
          isPaid: i % 2 === 0,
        },
      })
    }

    const page = await repo.getWorkOrdersPaginated(1, 2, {
      isPaid: 'true',
      minTotalValue: '20',
    })
    expect(page.totalCount).toBe(2) // valores 30 e 50 pagos
    expect(page.data.map((w) => w.paymentOrder?.totalValue)).toEqual([50, 30])
    expect(page.hasMore).toBe(false)
  })
})

describe('clone', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('cria nova OS com os produtos do relatório e marca a original como COPIED', async () => {
    const id = await repo.addWorkOrderWithDetails({
      customerId: CUST,
      scheduledDate: new Date(),
      items: [item(P1, 1, 10.1)],
      result: { exchanged: [item(P1, 1, 10.1)], added: [], removed: [] },
    })
    const newId = await repo.addCreateFromFinished(id as UUID, new Date())
    expect(woRow(id).status).toBe(WorkOrderStatus.COPIED)
    expect(woRow(newId).status).toBe(WorkOrderStatus.PENDING)
    const loaded = await repo.getWorkOrder(newId)
    expect(loaded?.products).toHaveLength(1)
  })
})
