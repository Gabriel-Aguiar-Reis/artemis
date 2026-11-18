/**
 * Itinerary preview/creation and backup restore against a real SQLite DB.
 */
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import DrizzleItineraryRepository from '@/src/infra/repositories/drizzle/drizzle.itinerary.repository'
import DrizzleWorkOrderRepository from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'
import { countRows, getTestDb, resetTestDb } from '@/src/test/sqlite-test-db'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/src/infra/db/drizzle/drizzle-client', async () =>
  (await import('@/src/test/sqlite-test-db')).drizzleClientMock()
)
vi.mock('expo-file-system', () => ({ File: class {} }))
vi.mock('expo-file-system/legacy', () => ({}))
vi.mock('expo-document-picker', () => ({}))

const CAT = '00000000-0000-4000-8000-000000000001'
const P1 = '00000000-0000-4000-8000-0000000000a1'
const CUST = '00000000-0000-4000-8000-0000000000c1'

function seed() {
  const { raw } = getTestDb()
  raw.exec(
    `INSERT INTO category (id, name, is_active) VALUES ('${CAT}', 'Bebidas', 1)`
  )
  raw.exec(
    `INSERT INTO product (id, name, category_id, sale_price, is_active, expiration)
     VALUES ('${P1}', 'Suco', '${CAT}', 10, 1, '6m')`
  )
  raw.exec(
    `INSERT INTO customer (id, store_name, contact_name, address_street_name, address_street_number,
       address_neighborhood, address_city, address_state, address_zip_code)
     VALUES ('${CUST}', 'Mercado', 'Ana', 'Rua A', '1', 'Centro', 'Taubaté', 'SP', '12000000')`
  )
}

const workOrders = new DrizzleWorkOrderRepository()
const itineraries = new DrizzleItineraryRepository()

function day(offset: number, hour = 12) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(hour, 0, 0, 0)
  return d
}

describe('itinerary preview vs creation', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('preview and created itinerary use the same open-status criterion', async () => {
    const ids = []
    for (let i = 0; i < 3; i++) {
      ids.push(
        await workOrders.addWorkOrderWithDetails({
          customerId: CUST,
          scheduledDate: day(1, 9 + i),
          items: [{ productId: P1, quantity: 1, priceSnapshot: 10 }],
        })
      )
    }
    // a cancelled order (no report/payment) inside the period
    getTestDb()
      .raw.prepare('UPDATE work_order SET status = ? WHERE id = ?')
      .run(WorkOrderStatus.CANCELLED, ids[2])

    const preview = await workOrders.getWorkOrdersByDateRange(day(0), day(2))
    expect(preview).toHaveLength(2)

    await itineraries.addItinerary({
      initialItineraryDate: day(0, 0).toISOString(),
      finalItineraryDate: day(2, 0).toISOString(),
    } as any)
    expect(countRows('itinerary_work_order')).toBe(preview.length)
  })
})

describe('backup restore', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('never leaves two active itineraries', async () => {
    const { raw } = getTestDb()
    raw.exec(
      `INSERT INTO itinerary (id, initial_itinerary_date, final_itinerary_date, is_finished)
       VALUES ('00000000-0000-4000-8000-0000000000e1', '2026-11-16', '2026-11-22', 0)`
    )
    const { importDumpFromJsonString } =
      await import('@/src/application/services/dump.service')
    const dump = {
      version: 1,
      createdAt: new Date().toISOString(),
      tables: {
        itinerary: [
          {
            id: '00000000-0000-4000-8000-0000000000e2',
            initialItineraryDate: '2026-11-09',
            finalItineraryDate: '2026-11-15',
            isFinished: false,
          },
          {
            id: '00000000-0000-4000-8000-0000000000e3',
            initialItineraryDate: '2026-11-02',
            finalItineraryDate: '2026-11-08',
            isFinished: true,
          },
        ],
      },
    }
    const result = await importDumpFromJsonString(JSON.stringify(dump))

    const active = raw
      .prepare('SELECT id FROM itinerary WHERE is_finished = 0')
      .all() as { id: string }[]
    expect(active.map((r) => r.id)).toEqual([
      '00000000-0000-4000-8000-0000000000e1',
    ])
    expect(result.report.inserted.itinerary).toBe(2)
    expect(result.report.notes).toHaveLength(1)
  })

  it('keeps the backup active itinerary when the device has none', async () => {
    const { importDumpFromJsonString } =
      await import('@/src/application/services/dump.service')
    const result = await importDumpFromJsonString(
      JSON.stringify({
        version: 1,
        createdAt: new Date().toISOString(),
        tables: {
          itinerary: [
            {
              id: '00000000-0000-4000-8000-0000000000e2',
              initialItineraryDate: '2026-11-09',
              finalItineraryDate: '2026-11-15',
              isFinished: false,
            },
          ],
        },
      })
    )
    expect(
      getTestDb()
        .raw.prepare(
          'SELECT count(*) AS n FROM itinerary WHERE is_finished = 0'
        )
        .get()
    ).toEqual({ n: 1 })
    expect(result.report.notes).toEqual([])
  })
})
