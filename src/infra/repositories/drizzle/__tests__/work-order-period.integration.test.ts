/**
 * Scheduled-period filter and per-month counts against a real SQLite DB.
 */
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import DrizzleWorkOrderRepository from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'
import { getTestDb, resetTestDb } from '@/src/test/sqlite-test-db'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/src/infra/db/drizzle/drizzle-client', async () =>
  (await import('@/src/test/sqlite-test-db')).drizzleClientMock()
)

const CAT = '00000000-0000-4000-8000-000000000001'
const P1 = '00000000-0000-4000-8000-0000000000a1'
const CUST = '00000000-0000-4000-8000-0000000000c1'

const repo = new DrizzleWorkOrderRepository()

function seedBase() {
  const { raw } = getTestDb()
  raw.exec(
    `INSERT INTO category (id, name, is_active) VALUES ('${CAT}', 'Extintores', 1)`
  )
  raw.exec(
    `INSERT INTO product (id, name, category_id, sale_price, is_active, expiration)
     VALUES ('${P1}', 'Recarga', '${CAT}', 10, 1, '6m')`
  )
  raw.exec(
    `INSERT INTO customer (id, store_name, contact_name, address_street_name, address_street_number,
       address_neighborhood, address_city, address_state, address_zip_code)
     VALUES ('${CUST}', 'Mercado', 'Ana', 'Rua A', '1', 'Centro', 'Taubaté', 'SP', '12000000')`
  )
}

async function order(date: Date, status?: WorkOrderStatus) {
  const id = await repo.addWorkOrderWithDetails({
    customerId: CUST,
    scheduledDate: date,
    items: [{ productId: P1, quantity: 1, priceSnapshot: 10 }],
  })
  if (status) {
    getTestDb()
      .raw.prepare('UPDATE work_order SET status = ? WHERE id = ?')
      .run(status, id)
  }
  return id
}

const iso = (d: Date) => d.toISOString()

describe('work order scheduled period', () => {
  beforeEach(async () => {
    resetTestDb()
    seedBase()
    await order(new Date(2026, 8, 10, 9), WorkOrderStatus.EXPIRED) // Sep
    await order(new Date(2026, 9, 1, 0, 30), WorkOrderStatus.EXPIRED) // Oct, just after midnight
    await order(new Date(2026, 9, 31, 23, 30)) // Oct, late evening (Nov in UTC)
    await order(new Date(2026, 10, 18, 12)) // Nov
  })

  it('filters by an inclusive range of whole days', async () => {
    const result = await repo.getWorkOrdersPaginated(1, 50, {
      scheduledFrom: iso(new Date(2026, 9, 1)),
      scheduledTo: iso(new Date(2026, 9, 31, 23, 59, 59, 999)),
    })
    expect(result.totalCount).toBe(2)
  })

  it('combines the period with the expired filter', async () => {
    const result = await repo.getWorkOrdersPaginated(1, 50, {
      scheduledFrom: iso(new Date(2026, 8, 1)),
      scheduledTo: iso(new Date(2026, 10, 30, 23, 59, 59, 999)),
      isExpired: 'true',
    })
    expect(result.totalCount).toBe(2)
    expect(
      result.data.every((wo) => wo.status === WorkOrderStatus.EXPIRED)
    ).toBe(true)
  })

  it('counts per local month with the same filters', async () => {
    expect(await repo.getWorkOrderMonthCounts({})).toEqual({
      '2026-09': 1,
      '2026-10': 2,
      '2026-11': 1,
    })
    expect(await repo.getWorkOrderMonthCounts({ isExpired: 'true' })).toEqual({
      '2026-09': 1,
      '2026-10': 1,
    })
  })
})

describe('next visit reminder', () => {
  beforeEach(() => {
    resetTestDb()
    seedBase()
  })

  const novRange = {
    scheduledFrom: iso(new Date(2026, 10, 1)),
    scheduledTo: iso(new Date(2026, 10, 30, 23, 59, 59, 999)),
  }

  it('is saved on a closed work order without leaving its period', async () => {
    const id = await order(
      new Date(2026, 10, 18, 12),
      WorkOrderStatus.COMPLETED
    )

    await repo.updateWorkOrder({
      id,
      scheduledDate: new Date(2026, 10, 18, 12),
      nextVisitDate: new Date(2027, 8, 1, 12),
    } as any)

    const wo = await repo.getWorkOrder(id)
    expect(wo?.nextVisitDate?.getFullYear()).toBe(2027)
    expect(wo?.scheduledDate.getFullYear()).toBe(2026)

    const nov = await repo.getWorkOrdersPaginated(1, 50, novRange)
    expect(nov.totalCount).toBe(1)
    expect(nov.data[0].nextVisitDate?.getMonth()).toBe(8)
  })

  it('does not unlock changing the scheduled date of a closed work order', async () => {
    const id = await order(
      new Date(2026, 10, 18, 12),
      WorkOrderStatus.COMPLETED
    )

    await expect(
      repo.updateWorkOrder({
        id,
        scheduledDate: new Date(2027, 8, 1, 12),
      } as any)
    ).rejects.toThrow('já foi encerrada')
  })

  it('keeps the reminder when other fields are edited and clears it with null', async () => {
    const id = await order(new Date(2026, 10, 18, 12))
    await repo.updateWorkOrder({
      id,
      nextVisitDate: new Date(2027, 8, 1, 12),
    } as any)

    await repo.updateWorkOrder({ id, notes: 'obs' } as any)
    expect((await repo.getWorkOrder(id))?.nextVisitDate).toBeDefined()

    await repo.updateWorkOrder({ id, nextVisitDate: null } as any)
    expect((await repo.getWorkOrder(id))?.nextVisitDate).toBeUndefined()
  })
})

describe('next visit filters', () => {
  async function withReminder(scheduled: Date, next?: Date) {
    const id = await order(scheduled, WorkOrderStatus.COMPLETED)
    if (next) {
      await repo.updateWorkOrder({
        id,
        scheduledDate: scheduled,
        nextVisitDate: next,
      } as any)
    }
    return id
  }

  beforeEach(async () => {
    resetTestDb()
    seedBase()
    await withReminder(new Date(2026, 10, 3, 9), new Date(2027, 8, 20, 12)) // Sep 2027 (late)
    await withReminder(new Date(2026, 10, 5, 9), new Date(2027, 8, 2, 12)) // Sep 2027 (early)
    await withReminder(new Date(2026, 10, 7, 9), new Date(2027, 2, 10, 12)) // Mar 2027
    await withReminder(new Date(2026, 10, 9, 9)) // no reminder
  })

  it('filters by presence of a reminder', async () => {
    const withIt = await repo.getWorkOrdersPaginated(1, 50, {
      hasNextVisit: 'true',
    })
    const without = await repo.getWorkOrdersPaginated(1, 50, {
      hasNextVisit: 'false',
    })
    expect(withIt.totalCount).toBe(3)
    expect(without.totalCount).toBe(1)
    expect(without.data[0].nextVisitDate).toBeUndefined()
  })

  it('filters by an inclusive range of whole days', async () => {
    const result = await repo.getWorkOrdersPaginated(1, 50, {
      nextVisitFrom: iso(new Date(2027, 8, 1)),
      nextVisitTo: iso(new Date(2027, 8, 30, 23, 59, 59, 999)),
    })
    expect(result.totalCount).toBe(2)
  })

  it('orders by the reminder, soonest first, instead of the scheduled date', async () => {
    const result = await repo.getWorkOrdersPaginated(1, 50, {
      hasNextVisit: 'true',
    })
    expect(result.data.map((wo) => wo.nextVisitDate?.getTime())).toEqual([
      new Date(2027, 2, 10, 12).getTime(),
      new Date(2027, 8, 2, 12).getTime(),
      new Date(2027, 8, 20, 12).getTime(),
    ])
  })

  it('keeps the scheduled-date order when not browsing by reminder', async () => {
    const result = await repo.getWorkOrdersPaginated(1, 50, {
      hasNextVisit: 'false',
    })
    const all = await repo.getWorkOrdersPaginated(1, 50, {})
    expect(all.data[0].scheduledDate.getDate()).toBe(9) // newest first
    expect(result.data).toHaveLength(1)
  })

  it('counts per month of the reminder when browsing by it', async () => {
    expect(
      await repo.getWorkOrderMonthCounts({ hasNextVisit: 'true' })
    ).toEqual({ '2027-03': 1, '2027-09': 2 })
    // without the reminder filter the months are still the scheduled ones
    expect(await repo.getWorkOrderMonthCounts({})).toEqual({ '2026-11': 4 })
  })

  it('combines with the scheduled period: moving the reminder does not leave November', async () => {
    const result = await repo.getWorkOrdersPaginated(1, 50, {
      scheduledFrom: iso(new Date(2026, 10, 1)),
      scheduledTo: iso(new Date(2026, 10, 30, 23, 59, 59, 999)),
      hasNextVisit: 'true',
    })
    expect(result.totalCount).toBe(3)
  })
})
