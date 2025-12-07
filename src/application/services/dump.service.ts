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
import { eq } from 'drizzle-orm'
import * as DocumentPicker from 'expo-document-picker'
import * as FS from 'expo-file-system'
import { File } from 'expo-file-system'
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
  // Use a known writable path; fall back to app root if types don't expose constants
  const baseDir =
    (FS as any).cacheDirectory ?? (FS as any).documentDirectory ?? '/'
  const targetPath = `${baseDir}artemis-dump.json`
  await FS.writeAsStringAsync(targetPath, json)
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

export async function importDumpFromPickedFile(
  fileUri: string
): Promise<ArtemisDump> {
  const file = new File(fileUri)
  const text = await file.text()
  const parsed = JSON.parse(text) as ArtemisDump

  insertAllTablesInOrder(parsed)
  return parsed
}

export async function importDumpFromJsonString(
  json: string
): Promise<ArtemisDump> {
  const parsed = JSON.parse(json) as ArtemisDump
  insertAllTablesInOrder(parsed)
  return parsed
}

function insertAllTablesInOrder(parsed: ArtemisDump) {
  // Base tables first
  for (const c of parsed.tables.category) {
    const exists = db
      .select()
      .from(category)
      .where(eq(category.id, c.id))
      .limit(1)
      .get()
    if (!exists) db.insert(category).values(c).run()
  }
  for (const li of parsed.tables.license) {
    const exists = db
      .select()
      .from(license)
      .where(eq(license.id, li.id))
      .limit(1)
      .get()
    if (!exists) db.insert(license).values(li).run()
  }
  for (const cu of parsed.tables.customer) {
    const exists = db
      .select()
      .from(customer)
      .where(eq(customer.id, cu.id))
      .limit(1)
      .get()
    if (!exists) db.insert(customer).values(cu).run()
  }
  // Product depends on category
  for (const p of parsed.tables.product) {
    const exists = db
      .select()
      .from(product)
      .where(eq(product.id, p.id))
      .limit(1)
      .get()
    if (!exists) db.insert(product).values(p).run()
  }
  // Itinerary tree
  for (const it of parsed.tables.itinerary) {
    const exists = db
      .select()
      .from(itinerary)
      .where(eq(itinerary.id, it.id))
      .limit(1)
      .get()
    if (!exists) db.insert(itinerary).values(it).run()
  }
  for (const wo of parsed.tables.workOrder) {
    const exists = db
      .select()
      .from(workOrder)
      .where(eq(workOrder.id, wo.id))
      .limit(1)
      .get()
    if (!exists) db.insert(workOrder).values(wo).run()
  }
  for (const woi of parsed.tables.workOrderItem) {
    const exists = db
      .select()
      .from(workOrderItem)
      .where(eq(workOrderItem.id, woi.id))
      .limit(1)
      .get()
    if (!exists) db.insert(workOrderItem).values(woi).run()
  }
  for (const wor of parsed.tables.workOrderResult) {
    const exists = db
      .select()
      .from(workOrderResult)
      .where(eq(workOrderResult.id, wor.id))
      .limit(1)
      .get()
    if (!exists) db.insert(workOrderResult).values(wor).run()
  }
  for (const wori of parsed.tables.workOrderResultItem) {
    const exists = db
      .select()
      .from(workOrderResultItem)
      .where(eq(workOrderResultItem.id, wori.id))
      .limit(1)
      .get()
    if (!exists) db.insert(workOrderResultItem).values(wori).run()
  }
  // Link table after both itinerary and workOrder
  for (const iwo of parsed.tables.itineraryWorkOrder) {
    const exists = db
      .select()
      .from(itineraryWorkOrder)
      .where(eq(itineraryWorkOrder.id, iwo.id))
      .limit(1)
      .get()
    if (!exists) db.insert(itineraryWorkOrder).values(iwo).run()
  }
  // Payment orders (likely independent)
  for (const po of parsed.tables.paymentOrder) {
    const exists = db
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.id, po.id))
      .limit(1)
      .get()
    if (!exists) db.insert(paymentOrder).values(po).run()
  }
}
