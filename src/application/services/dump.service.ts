import { db } from '@/src/infra/db/drizzle/drizzle-client'
import {
  category,
  CategoryTable,
} from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import {
  customer,
  CustomerTable,
} from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import {
  itineraryWorkOrder,
  ItineraryWorkOrderTable,
} from '@/src/infra/db/drizzle/schema/drizzle.itinerary-work-order.schema'
import {
  itinerary,
  ItineraryTable,
} from '@/src/infra/db/drizzle/schema/drizzle.itinerary.schema'
import {
  license,
  LicenseTable,
} from '@/src/infra/db/drizzle/schema/drizzle.license.schema'
import {
  paymentOrder,
  PaymentOrderTable,
} from '@/src/infra/db/drizzle/schema/drizzle.payment-order.schema'
import {
  product,
  ProductTable,
} from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import {
  workOrderItem,
  WorkOrderItemTable,
} from '@/src/infra/db/drizzle/schema/drizzle.work-order-item.schema'
import {
  workOrderResultItem,
  WorkOrderResultItemTable,
} from '@/src/infra/db/drizzle/schema/drizzle.work-order-result-item.schema'
import {
  workOrderResult,
  WorkOrderResultTable,
} from '@/src/infra/db/drizzle/schema/drizzle.work-order-result.schema'
import {
  workOrder,
  WorkOrderTable,
} from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'
import * as FS from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

export type ArtemisDump = {
  version: number
  createdAt: string
  tables: {
    category: CategoryTable[]
    product: ProductTable[]
    customer: CustomerTable[]
    itinerary: ItineraryTable[]
    itineraryWorkOrder: ItineraryWorkOrderTable[]
    license: LicenseTable[]
    paymentOrder: PaymentOrderTable[]
    workOrder: WorkOrderTable[]
    workOrderItem: WorkOrderItemTable[]
    workOrderResult: WorkOrderResultTable[]
    workOrderResultItem: WorkOrderResultItemTable[]
  }
}

export async function buildDumpJsonString(): Promise<string> {
  const categories = db.select().from(category).all()
  const products = db.select().from(product).all()
  const customers = db.select().from(customer).all()
  const itineraries = db.select().from(itinerary).all()
  const itineraryWorkOrders = db.select().from(itineraryWorkOrder).all()
  const licenses = db.select().from(license).all()
  const paymentOrders = db.select().from(paymentOrder).all()
  const workOrders = db.select().from(workOrder).all()
  const workOrderItems = db.select().from(workOrderItem).all()
  const workOrderResults = db.select().from(workOrderResult).all()
  const workOrderResultItems = db.select().from(workOrderResultItem).all()

  const dump: ArtemisDump = {
    version: 1,
    createdAt: new Date().toISOString(),
    tables: {
      category: categories,
      product: products,
      customer: customers,
      itinerary: itineraries,
      itineraryWorkOrder: itineraryWorkOrders,
      license: licenses,
      paymentOrder: paymentOrders,
      workOrder: workOrders,
      workOrderItem: workOrderItems,
      workOrderResult: workOrderResults,
      workOrderResultItem: workOrderResultItems,
    },
  }

  return JSON.stringify(dump)
}

export async function saveDumpJsonToTempAndShare(): Promise<string> {
  const json = await buildDumpJsonString()
  // Use legacy API to get the cache directory path
  const baseDir = FS.cacheDirectory ?? FS.documentDirectory
  if (!baseDir) {
    throw new Error('No writable directory available')
  }
  const targetPath = `${baseDir}artemis-dump.json`
  // Use new File API to write
  const file = new File(targetPath)
  if (file.exists) {
    file.delete()
  }
  file.create()
  file.write(json)

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(targetPath, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Exportar dump JSON',
    })
  }
  return targetPath
}

export async function pickDumpJson(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  })
  if (result.canceled) return null
  const asset = result.assets[0]
  return asset.uri
}

export type DumpTableKey = keyof ArtemisDump['tables']

export type ImportReport = {
  /** New rows written, per table */
  inserted: Record<DumpTableKey, number>
  /** Rows that already existed (same id) and were kept as they are */
  skipped: Record<DumpTableKey, number>
  /** Rows rejected (invalid data or missing reference) */
  rejected: { table: DumpTableKey; id: string; reason: string }[]
}

export type ImportResult = ArtemisDump & { report: ImportReport }

const TABLE_KEYS: DumpTableKey[] = [
  'category',
  'license',
  'customer',
  'product',
  'itinerary',
  'paymentOrder',
  'workOrderResult',
  'workOrder',
  'workOrderItem',
  'workOrderResultItem',
  'itineraryWorkOrder',
]

/** Validates the file's overall structure before touching the database. */
export function parseDump(json: string): ArtemisDump {
  let raw: any
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('O arquivo não é um JSON válido.')
  }
  if (!raw || typeof raw !== 'object' || !raw.tables)
    throw new Error('O arquivo não é um backup do aplicativo.')
  if (raw.version !== undefined && Number(raw.version) > 1)
    throw new Error(
      `Backup gerado por uma versão mais nova do aplicativo (v${raw.version}). Atualize o app antes de importar.`
    )
  for (const key of TABLE_KEYS) {
    const value = raw.tables[key]
    if (value === undefined) raw.tables[key] = []
    else if (!Array.isArray(value))
      throw new Error(`Backup inválido: a tabela "${key}" não é uma lista.`)
  }
  return raw as ArtemisDump
}

export async function importDumpFromPickedFile(
  fileUri: string
): Promise<ImportResult> {
  const file = new File(fileUri)
  const text = await file.text()
  const parsed = parseDump(text)
  const report = insertAllTablesInOrder(parsed)
  return { ...parsed, report }
}

export async function importDumpFromJsonString(
  json: string
): Promise<ImportResult> {
  const parsed = parseDump(json)
  const report = insertAllTablesInOrder(parsed)
  return { ...parsed, report }
}

const INSERT_CHUNK = 200

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v)

/**
 * Restores the backup:
 * - everything in one transaction (before: one commit per row; a failure midway left
 *   the restore half done)
 * - order that respects foreign keys
 * - rows with a missing reference or missing required fields are
 *   rejected and listed in the report, instead of aborting everything
 * - batch insert with ON CONFLICT DO NOTHING (an existing id is kept)
 */
function insertAllTablesInOrder(parsed: ArtemisDump): ImportReport {
  const zero = () =>
    Object.fromEntries(TABLE_KEYS.map((k) => [k, 0])) as Record<
      DumpTableKey,
      number
    >
  const report: ImportReport = {
    inserted: zero(),
    skipped: zero(),
    rejected: [],
  }

  const idsOf = (table: any): Set<string> =>
    new Set(
      (db.select({ id: table.id }).from(table).all() as { id: string }[]).map(
        (r) => r.id
      )
    )

  const t = parsed.tables

  // Known ids = already in the database + present in the backup (validated below)
  const known = {
    category: idsOf(category),
    customer: idsOf(customer),
    product: idsOf(product),
    itinerary: idsOf(itinerary),
    paymentOrder: idsOf(paymentOrder),
    workOrderResult: idsOf(workOrderResult),
    workOrder: idsOf(workOrder),
  }
  const hasLicense = idsOf(license).size > 0

  type Check = (row: any) => string | null
  const plan: {
    key: DumpTableKey
    table: any
    check: Check
    fix?: (row: any) => any
  }[] = [
    {
      key: 'category',
      table: category,
      check: (r) => (isStr(r.name) ? null : 'sem nome'),
    },
    {
      key: 'license',
      table: license,
      // Never creates a second license: getLicense reads only the first row
      check: () => (hasLicense ? 'o aparelho já possui licença' : null),
    },
    {
      key: 'customer',
      table: customer,
      check: (r) => (isStr(r.storeName) ? null : 'sem nome da loja'),
    },
    {
      key: 'product',
      table: product,
      check: (r) =>
        !isStr(r.name)
          ? 'sem nome'
          : !isNum(r.salePrice)
            ? 'preço inválido'
            : !known.category.has(r.categoryId)
              ? 'categoria inexistente'
              : null,
    },
    {
      key: 'itinerary',
      table: itinerary,
      check: (r) =>
        isStr(r.initialItineraryDate) && isStr(r.finalItineraryDate)
          ? null
          : 'datas ausentes',
    },
    {
      key: 'paymentOrder',
      table: paymentOrder,
      check: (r) => (isNum(r.totalValue) ? null : 'valor inválido'),
    },
    {
      key: 'workOrderResult',
      table: workOrderResult,
      check: (r) => (isNum(r.totalValue) ? null : 'valor inválido'),
    },
    {
      key: 'workOrder',
      table: workOrder,
      // Statuses from older versions could be lowercase
      fix: (r) => ({
        ...r,
        status: String(r.status ?? 'PENDING').toUpperCase(),
      }),
      check: (r) =>
        !known.customer.has(r.customerId)
          ? 'cliente inexistente'
          : !isStr(r.scheduledDate)
            ? 'sem data agendada'
            : r.paymentOrderId && !known.paymentOrder.has(r.paymentOrderId)
              ? 'pagamento inexistente'
              : r.resultId && !known.workOrderResult.has(r.resultId)
                ? 'relatório inexistente'
                : null,
    },
    {
      key: 'workOrderItem',
      table: workOrderItem,
      check: (r) =>
        !known.workOrder.has(r.workOrderId)
          ? 'OS inexistente'
          : !known.product.has(r.productId)
            ? 'produto inexistente'
            : null,
    },
    {
      key: 'workOrderResultItem',
      table: workOrderResultItem,
      check: (r) =>
        !known.workOrderResult.has(r.resultId)
          ? 'relatório inexistente'
          : !known.product.has(r.productId)
            ? 'produto inexistente'
            : null,
    },
    {
      key: 'itineraryWorkOrder',
      table: itineraryWorkOrder,
      check: (r) =>
        !known.itinerary.has(r.itineraryId)
          ? 'itinerário inexistente'
          : !known.workOrder.has(r.workOrderId)
            ? 'OS inexistente'
            : null,
    },
  ]

  db.transaction((tx: any) => {
    for (const { key, table, check, fix } of plan) {
      const existing = idsOf(table)
      const toInsert: any[] = []
      for (const original of t[key] as any[]) {
        const row = fix ? fix(original) : original
        if (!isStr(row?.id)) {
          report.rejected.push({ table: key, id: '?', reason: 'sem id' })
          continue
        }
        if (existing.has(row.id)) {
          report.skipped[key]++
          continue
        }
        const reason = check(row)
        if (reason) {
          report.rejected.push({ table: key, id: row.id, reason })
          continue
        }
        existing.add(row.id)
        if (key in known) (known as any)[key].add(row.id)
        toInsert.push(row)
      }
      for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
        tx.insert(table)
          .values(toInsert.slice(i, i + INSERT_CHUNK))
          .onConflictDoNothing()
          .run()
      }
      report.inserted[key] += toInsert.length
    }
  })

  return report
}
