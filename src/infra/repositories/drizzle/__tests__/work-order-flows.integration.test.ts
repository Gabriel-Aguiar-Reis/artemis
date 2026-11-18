/**
 * Integration tests with real SQLite (node:sqlite + drizzle
 * expo-sqlite driver). They cover the transactional work order, report and payment flows.
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

describe('expo-sqlite driver: transaction semantics', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  const NEW_CAT = '00000000-0000-4000-8000-000000000099'

  it('synchronous callback: an error midway undoes everything (rollback)', () => {
    const { db } = getTestDb()
    expect(() =>
      db.transaction((tx) => {
        tx.insert(category).values({ id: NEW_CAT, name: 'X' }).run()
        throw new Error('falha no meio')
      })
    ).toThrow('falha no meio')
    expect(countRows('category')).toBe(1) // only the seed one
  })

  it('async callback is NOT atomic in this driver (which is why the code uses a synchronous one)', async () => {
    const { db } = getTestDb()
    await expect(
      db.transaction(async (tx) => {
        await tx.insert(category).values({ id: NEW_CAT, name: 'X' })
        throw new Error('falha no meio')
      })
    ).rejects.toThrow('falha no meio')
    // the COMMIT had already run before the await: the insert stayed written
    expect(countRows('category')).toBe(2)
  })
})

describe('addWorkOrderWithDetails', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('creates work order, items, report and payment with correct status and totals', async () => {
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
    // exchanged 1 of 2 scheduled and collected 1 → PARTIAL
    expect(wo.status).toBe(WorkOrderStatus.PARTIAL)
    expect(wo.visit_date).toBeTruthy()
    expect(countRows('work_order_item')).toBe(2)
    expect(countRows('work_order_result_item')).toBe(3)

    const result = getTestDb()
      .raw.prepare('SELECT total_value FROM work_order_result')
      .get() as any
    expect(result.total_value).toBe(20.5) // 2×10.10 + 3×0.10 with no float error

    const po = getTestDb()
      .raw.prepare('SELECT * FROM payment_order')
      .get() as any
    expect(po.is_paid).toBe(1)
    expect(po.paid_installments).toBe(3)

    // batch hydration returns the complete aggregate
    const loaded = await repo.getWorkOrder(id as UUID)
    expect(loaded?.products).toHaveLength(2)
    expect(loaded?.result?.exchangedProducts).toHaveLength(1)
    expect(loaded?.result?.addedProducts).toHaveLength(1)
    expect(loaded?.result?.removedProducts).toHaveLength(1)
    expect(loaded?.customer.storeAddress.streetNumber).toBe('S/N')
  })

  it('is atomic: if an item fails, nothing is written (no orphan report/payment)', async () => {
    await expect(
      repo.addWorkOrderWithDetails({
        customerId: CUST,
        scheduledDate: new Date(),
        items: [item(P1, 1, 10.1), item(MISSING, 1, 5)], // nonexistent product → FK
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

  it('rejects fractional or zero quantity before writing', async () => {
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

describe('visit report', () => {
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

  it('addResultToWorkOrder stores the enum status (never lowercase "completed") and syncs payment', async () => {
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

  it('nothing exchanged or added becomes FAILED', async () => {
    await repo.addResultToWorkOrder(woId, {
      exchanged: [],
      added: [],
      removed: [item(P1, 1, 10.1)],
    })
    expect(woRow(woId).status).toBe(WorkOrderStatus.FAILED)
  })

  it('updateWorkOrderResultItems recalculates status/total and is atomic', async () => {
    const resultId = await repo.addResultToWorkOrder(woId, {
      exchanged: [item(P1, 1, 10.1)],
      added: [],
      removed: [],
    })

    // failure midway (nonexistent product): old items are still there
    await expect(
      repo.updateWorkOrderResultItems(resultId, {
        exchanged: [item(MISSING, 1, 1)],
        added: [],
        removed: [],
      })
    ).rejects.toThrow()
    expect(countRows('work_order_result_item')).toBe(1)
    expect(woRow(woId).status).toBe(WorkOrderStatus.COMPLETED)

    // success: now it collected → PARTIAL, total recalculated
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

  it('does not allow changing the report of an already paid work order', async () => {
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

describe('payment', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('settling the payment does not turn PARTIAL into COMPLETED and stores the date', async () => {
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
    expect(po.is_paid).toBe(1) // 2 of 2 installments ⇒ paid
    expect(po.payment_date).toBe('2026-11-18T10:00:00.000Z')
    expect(woRow(id).status).toBe(WorkOrderStatus.PARTIAL)
  })
})

describe('paginated listing', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('paid/value filter does not break the COUNT and the order is stable', async () => {
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
    expect(page.totalCount).toBe(2) // values 30 and 50 paid
    expect(page.data.map((w) => w.paymentOrder?.totalValue)).toEqual([50, 30])
    expect(page.hasMore).toBe(false)
  })
})

describe('clone', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('creates a new work order with the report products and marks the original as COPIED', async () => {
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

describe('addPaymentToWorkOrder', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('creates and links the payment in one go; a double tap is rejected without orphans', async () => {
    const id = await repo.addWorkOrderWithDetails({
      customerId: CUST,
      scheduledDate: new Date(),
      items: [item(P1, 1, 10.1)],
    })
    const pay = {
      method: 'PIX',
      totalValue: 10.1,
      installments: 2,
      isPaid: false,
    }
    const poId = await repo.addPaymentToWorkOrder(id as UUID, pay)
    expect(woRow(id).payment_order_id).toBe(poId)

    await expect(repo.addPaymentToWorkOrder(id as UUID, pay)).rejects.toThrow(
      'já possui pagamento'
    )
    expect(countRows('payment_order')).toBe(1)
  })

  it('a settled payment on an open order with a report applies the report status', async () => {
    const id = await repo.addWorkOrderWithDetails({
      customerId: CUST,
      scheduledDate: new Date(),
      items: [item(P1, 2, 10.1)],
    })
    // report recorded without payment, then status forced back to open
    await repo.addResultToWorkOrder(id as UUID, {
      exchanged: [item(P1, 1, 10.1)],
      added: [],
      removed: [],
    })
    getTestDb()
      .raw.prepare("UPDATE work_order SET status = 'PENDING' WHERE id = ?")
      .run(id)

    await repo.addPaymentToWorkOrder(id as UUID, {
      method: 'Dinheiro',
      totalValue: 10.1,
      installments: 1,
      isPaid: true,
    })
    const po = getTestDb()
      .raw.prepare('SELECT * FROM payment_order')
      .get() as any
    expect(po.is_paid).toBe(1)
    expect(po.paid_installments).toBe(1)
    // the rule compares distinct products: P1 scheduled, P1 exchanged
    expect(woRow(id).status).toBe(WorkOrderStatus.COMPLETED)
  })

  it('the legacy link method no longer replaces an existing payment', async () => {
    const id = await repo.addWorkOrderWithDetails({
      customerId: CUST,
      scheduledDate: new Date(),
      items: [item(P1, 1, 10.1)],
      payment: {
        method: 'PIX',
        totalValue: 10,
        installments: 1,
        isPaid: false,
      },
    })
    const other = await paymentRepo.addPaymentOrder({
      method: 'PIX',
      totalValue: '5',
    } as any)
    await expect(
      repo.updateWorkOrderWithPayment(id as UUID, other as UUID)
    ).rejects.toThrow('já possui pagamento')
  })
})
