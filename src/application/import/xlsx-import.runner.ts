import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { category } from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { product } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import {
  CategoryRow,
  CustomerRow,
  ImportSheet,
  ProductRow,
  RowIssue,
  customerDedupeKeys,
  dataRows,
  nameKey,
  validateCategoryRow,
  validateCustomerRow,
  validateProductRow,
} from '@/src/lib/xlsx-import'
import uuid from 'react-native-uuid'

export const IMPORT_CHUNK_SIZE = 200

export type SheetRows = Partial<Record<ImportSheet, unknown[][]>>

export type ImportPlan = {
  categories: CategoryRow[]
  products: Array<ProductRow & { categoryId: string }>
  customers: CustomerRow[]
  /** New categories (name -> id) created by this import */
  newCategoryIds: Map<string, string>
  duplicates: RowIssue[]
  rejected: RowIssue[]
  /** Rows read per sheet (without header / empty rows) */
  totals: Record<ImportSheet, number>
}

export type ImportProgress = {
  sheet: ImportSheet
  done: number
  total: number
}

export type ImportReport = {
  inserted: Record<ImportSheet, number>
  duplicates: RowIssue[]
  rejected: RowIssue[]
}

const SHEETS: ImportSheet[] = ['categorias', 'produtos', 'clientes']

const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** Reads the database once and validates/deduplicates all rows. Writes nothing. */
export async function prepareImport(rows: SheetRows): Promise<ImportPlan> {
  const [dbCategories, dbProducts, dbCustomers] = await Promise.all([
    db.select({ id: category.id, name: category.name }).from(category),
    db.select({ name: product.name }).from(product),
    db
      .select({
        storeName: customer.storeName,
        phoneNumber: customer.phoneNumber,
        addressZipCode: customer.addressZipCode,
        addressStreetNumber: customer.addressStreetNumber,
      })
      .from(customer),
  ])

  const plan: ImportPlan = {
    categories: [],
    products: [],
    customers: [],
    newCategoryIds: new Map(),
    duplicates: [],
    rejected: [],
    totals: { categorias: 0, produtos: 0, clientes: 0 },
  }

  // normalized name -> id (database + new)
  const categoryIds = new Map<string, string>()
  for (const c of dbCategories) categoryIds.set(nameKey(c.name), c.id)
  const seenCategoryNames = new Set(categoryIds.keys())

  // --- Categories ---
  const catRows = dataRows(rows.categorias ?? [])
  plan.totals.categorias = catRows.length
  for (const { row, line } of catRows) {
    const v = validateCategoryRow(row, line)
    if (!v.ok) {
      plan.rejected.push({ sheet: 'categorias', line, reason: v.reason })
      continue
    }
    const key = nameKey(v.value.name)
    if (seenCategoryNames.has(key)) {
      plan.duplicates.push({
        sheet: 'categorias',
        line,
        reason: `Categoria "${v.value.name}" já existe (banco ou planilha).`,
      })
      continue
    }
    seenCategoryNames.add(key)
    const id = String(uuid.v4())
    categoryIds.set(key, id)
    plan.newCategoryIds.set(key, id)
    plan.categories.push(v.value)
  }

  // --- Products ---
  const seenProducts = new Set(dbProducts.map((p) => nameKey(p.name)))
  const prodRows = dataRows(rows.produtos ?? [])
  plan.totals.produtos = prodRows.length
  for (const { row, line } of prodRows) {
    const v = validateProductRow(row, line)
    if (!v.ok) {
      plan.rejected.push({ sheet: 'produtos', line, reason: v.reason })
      continue
    }
    const categoryId = categoryIds.get(nameKey(v.value.categoryName))
    if (!categoryId) {
      plan.rejected.push({
        sheet: 'produtos',
        line,
        reason: `Categoria "${v.value.categoryName}" não encontrada.`,
      })
      continue
    }
    const key = nameKey(v.value.name)
    if (seenProducts.has(key)) {
      plan.duplicates.push({
        sheet: 'produtos',
        line,
        reason: `Produto "${v.value.name}" já existe (banco ou planilha).`,
      })
      continue
    }
    seenProducts.add(key)
    plan.products.push({ ...v.value, categoryId })
  }

  // --- Customers ---
  const seenCustomers = new Set<string>()
  for (const c of dbCustomers) {
    for (const k of customerDedupeKeys(c)) seenCustomers.add(k)
  }
  const custRows = dataRows(rows.clientes ?? [])
  plan.totals.clientes = custRows.length
  for (const { row, line } of custRows) {
    const v = validateCustomerRow(row, line)
    if (!v.ok) {
      plan.rejected.push({ sheet: 'clientes', line, reason: v.reason })
      continue
    }
    const keys = customerDedupeKeys(v.value)
    if (keys.some((k) => seenCustomers.has(k))) {
      plan.duplicates.push({
        sheet: 'clientes',
        line,
        reason: `Cliente "${v.value.storeName}" já existe (mesmo telefone ou mesmo endereço).`,
      })
      continue
    }
    keys.forEach((k) => seenCustomers.add(k))
    plan.customers.push(v.value)
  }

  return plan
}

export function planInsertCount(plan: ImportPlan): number {
  return plan.categories.length + plan.products.length + plan.customers.length
}

/**
 * Inserts a chunk in a transaction (synchronous: in the expo-sqlite driver the callback
 * of db.transaction must be synchronous for BEGIN/COMMIT to hold). If the chunk fails, retries row by row to
 * isolate the problematic row(s) and return them as rejected.
 */
async function insertChunk<T extends { line: number }>(
  sheet: ImportSheet,
  chunk: T[],
  toValues: (item: T) => any,
  insert: (tx: any, values: any[]) => unknown,
  rejected: RowIssue[]
): Promise<number> {
  try {
    db.transaction((tx) => {
      insert(tx, chunk.map(toValues))
    })
    return chunk.length
  } catch {
    let ok = 0
    for (const item of chunk) {
      try {
        db.transaction((tx) => {
          insert(tx, [toValues(item)])
        })
        ok++
      } catch (e) {
        rejected.push({
          sheet,
          line: item.line,
          reason:
            e instanceof Error
              ? `Falha ao gravar: ${e.message}`
              : 'Falha ao gravar.',
        })
      }
    }
    return ok
  }
}

/** Writes the plan in chunks of ~200, yielding the thread between them. */
export async function executeImport(
  plan: ImportPlan,
  onProgress?: (
    p: ImportProgress & { overallDone: number; overallTotal: number }
  ) => void
): Promise<ImportReport> {
  const overallTotal = planInsertCount(plan)
  let overallDone = 0
  const rejected: RowIssue[] = [...plan.rejected]
  const inserted: Record<ImportSheet, number> = {
    categorias: 0,
    produtos: 0,
    clientes: 0,
  }

  const report = (sheet: ImportSheet, done: number, total: number) =>
    onProgress?.({ sheet, done, total, overallDone, overallTotal })

  async function run<T extends { line: number }>(
    sheet: ImportSheet,
    items: T[],
    toValues: (item: T) => any,
    insert: (tx: any, values: any[]) => unknown
  ) {
    report(sheet, 0, items.length)
    for (let i = 0; i < items.length; i += IMPORT_CHUNK_SIZE) {
      const chunk = items.slice(i, i + IMPORT_CHUNK_SIZE)
      inserted[sheet] += await insertChunk(
        sheet,
        chunk,
        toValues,
        insert,
        rejected
      )
      overallDone += chunk.length
      report(sheet, Math.min(i + chunk.length, items.length), items.length)
      await yieldToUi()
    }
  }

  await run(
    'categorias',
    plan.categories,
    (c) => ({
      id: plan.newCategoryIds.get(nameKey(c.name))!,
      name: c.name,
      isActive: c.isActive,
    }),
    (tx, values) => tx.insert(category).values(values).run()
  )

  // Products only go in if the new category was actually written
  let products = plan.products
  if (plan.newCategoryIds.size > 0) {
    const present = new Set(
      (await db.select({ id: category.id }).from(category)).map((r) => r.id)
    )
    const newIds = new Set(plan.newCategoryIds.values())
    products = plan.products.filter((p) => {
      if (newIds.has(p.categoryId) && !present.has(p.categoryId)) {
        rejected.push({
          sheet: 'produtos',
          line: p.line,
          reason: 'A categoria deste produto não pôde ser gravada.',
        })
        overallDone += 1
        return false
      }
      return true
    })
  }

  await run(
    'produtos',
    products,
    (p) => ({
      id: String(uuid.v4()),
      name: p.name,
      categoryId: p.categoryId,
      salePrice: p.salePrice,
      isActive: p.isActive,
      expiration: p.expiration,
    }),
    (tx, values) => tx.insert(product).values(values).run()
  )

  await run(
    'clientes',
    plan.customers,
    (c) => ({
      id: String(uuid.v4()),
      storeName: c.storeName,
      contactName: c.contactName,
      phoneNumber: c.phoneNumber,
      phoneIsWhatsApp: c.phoneIsWhatsApp,
      landlineNumber: c.landlineNumber,
      landlineIsWhatsApp: c.landlineIsWhatsApp,
      addressStreetName: c.addressStreetName,
      addressStreetNumber: c.addressStreetNumber,
      addressNeighborhood: c.addressNeighborhood,
      addressCity: c.addressCity,
      addressState: c.addressState,
      addressZipCode: c.addressZipCode,
    }),
    (tx, values) => tx.insert(customer).values(values).run()
  )

  rejected.sort(
    (a, b) =>
      SHEETS.indexOf(a.sheet) - SHEETS.indexOf(b.sheet) || a.line - b.line
  )
  return { inserted, duplicates: plan.duplicates, rejected }
}
