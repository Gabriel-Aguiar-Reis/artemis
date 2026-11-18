/**
 * Accent/case-insensitive search against a real SQLite database.
 */
import DrizzleCategoryRepository from '@/src/infra/repositories/drizzle/drizzle.category.repository'
import DrizzleCustomerRepository from '@/src/infra/repositories/drizzle/drizzle.customer.repository'
import DrizzleProductRepository from '@/src/infra/repositories/drizzle/drizzle.product.repository'
import DrizzleWorkOrderRepository from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'
import { getTestDb, resetTestDb } from '@/src/test/sqlite-test-db'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/src/infra/db/drizzle/drizzle-client', async () =>
  (await import('@/src/test/sqlite-test-db')).drizzleClientMock()
)

const CAT = '00000000-0000-4000-8000-000000000001'
const ids = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

function seed() {
  const { raw } = getTestDb()
  raw.exec(
    `INSERT INTO category (id, name, is_active) VALUES ('${CAT}', 'Laticínios', 1)`
  )
  raw.exec(
    `INSERT INTO product (id, name, category_id, sale_price, is_active, expiration)
     VALUES ('${ids(101)}', 'Pão de Açúcar', '${CAT}', 5, 1, '6m'),
            ('${ids(102)}', 'Café', '${CAT}', 7, 1, '6m')`
  )
  const customers: [number, string, string][] = [
    [201, 'Açaí da Praça', 'João'],
    [202, 'MERCADO SÃO JOSÉ', 'Inês'],
    [203, 'Padaria Central', 'Ana'],
    [204, 'Loja 100%_Off', 'Zé'],
  ]
  for (const [n, store, contact] of customers) {
    raw.exec(
      `INSERT INTO customer (id, store_name, contact_name, address_street_name, address_street_number,
         address_neighborhood, address_city, address_state, address_zip_code)
       VALUES ('${ids(n)}', '${store}', '${contact}', 'Rua', '1', 'Centro', 'Taubaté', 'SP', '12000000')`
    )
  }
  raw.exec(
    `INSERT INTO work_order (id, customer_id, scheduled_date, status)
     VALUES ('${ids(301)}', '${ids(201)}', '2026-11-20T12:00:00.000Z', 'PENDING')`
  )
}

const customers = new DrizzleCustomerRepository()
const products = new DrizzleProductRepository()
const categories = new DrizzleCategoryRepository()
const workOrders = new DrizzleWorkOrderRepository()

describe('accent-insensitive search', () => {
  beforeEach(() => {
    resetTestDb()
    seed()
  })

  it('combobox search ignores accents and case', async () => {
    expect(
      (await customers.searchCustomersLight('acai')).map((c) => c.storeName)
    ).toEqual(['Açaí da Praça'])
    expect(
      (await customers.searchCustomersLight('sao jose')).map((c) => c.storeName)
    ).toEqual(['MERCADO SÃO JOSÉ'])
    // contact name too, and accented term against accented data
    expect(
      (await customers.searchCustomersLight('INÊS')).map((c) => c.contactName)
    ).toEqual(['Inês'])
  })

  it('empty term lists customers ordered by name', async () => {
    const all = await customers.searchCustomersLight('', 2)
    expect(all.map((c) => c.storeName)).toEqual([
      'Açaí da Praça',
      'Loja 100%_Off',
    ])
  })

  it('treats % and _ in the term as literal characters', async () => {
    expect(
      (await customers.searchCustomersLight('100%_')).map((c) => c.storeName)
    ).toEqual(['Loja 100%_Off'])
    expect(await customers.searchCustomersLight('a_a')).toEqual([])
  })

  it('paginated customer list filters without accents', async () => {
    const page = await customers.getCustomersPaginated(1, 10, {
      search: 'padaria',
    } as any)
    expect(page.data.map((c) => c.storeName)).toEqual(['Padaria Central'])
    const byContact = await customers.getCustomersPaginated(1, 10, {
      contactName: 'joao',
    } as any)
    expect(byContact.data.map((c) => c.storeName)).toEqual(['Açaí da Praça'])
  })

  it('work order search matches customer without accents', async () => {
    const page = await workOrders.getWorkOrdersPaginated(1, 10, {
      search: 'ACAI',
    })
    expect(page.totalCount).toBe(1)
    expect(page.data[0].customer.storeName).toBe('Açaí da Praça')
  })

  it('product and category filters ignore accents', async () => {
    const byName = await products.getProductsWithCategory({
      search: 'acucar',
    } as any)
    expect(byName.map((p: any) => p.name)).toEqual(['Pão de Açúcar'])
    const byCategory = await products.getProductsWithCategory({
      categoryName: 'laticinios',
    } as any)
    expect(byCategory).toHaveLength(2)
    const cats = await categories.getCategories({ search: 'LATICINIOS' })
    expect(cats).toHaveLength(1)
  })
})
