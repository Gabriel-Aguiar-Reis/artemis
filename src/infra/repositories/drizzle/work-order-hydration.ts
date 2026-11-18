import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { PaymentOrderMapper } from '@/src/domain/entities/payment-order/mapper/payment-order.mapper'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import { WorkOrderResultItemMapper } from '@/src/domain/entities/work-order-result-item/mapper/work-order-result-item.mapper'
import {
  WorkOrderResultItem,
  WorkOrderResultItemType,
} from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderResultMapper } from '@/src/domain/entities/work-order-result/mapper/work-order-result.mapper'
import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { WorkOrderMapper } from '@/src/domain/entities/work-order/mapper/work-order.mapper'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { CustomerTable } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { PaymentOrderTable } from '@/src/infra/db/drizzle/schema/drizzle.payment-order.schema'
import { product } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import { workOrderItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-item.schema'
import { workOrderResultItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result-item.schema'
import {
  workOrderResult,
  WorkOrderResultTable,
} from '@/src/infra/db/drizzle/schema/drizzle.work-order-result.schema'
import { WorkOrderTable } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { UUID } from '@/src/lib/utils'
import { eq, inArray } from 'drizzle-orm'

/**
 * Carregamento em lote dos agregados de OS.
 *
 * Antes cada OS fazia 1 a 3 consultas próprias (itens, resultado, itens do
 * resultado), ou seja, N+1: 15 mil OS viravam ~45 mil consultas. Aqui são no
 * máximo 3 consultas por bloco de 500 ids, independentemente do número de OS.
 */

// SQLite limita a quantidade de parâmetros por consulta (999 nas versões
// antigas); 500 deixa folga.
const CHUNK = 500

function chunk<T>(arr: T[], size = CHUNK): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function unique(ids: (string | null | undefined)[]): string[] {
  return Array.from(new Set(ids.filter((id): id is string => !!id)))
}

export type WorkOrderJoinedRow = {
  workOrder: WorkOrderTable
  customer: CustomerTable | null
  paymentOrder?: PaymentOrderTable | null
  result?: WorkOrderResultTable | null
}

export async function loadItemsByWorkOrderIds(
  workOrderIds: string[]
): Promise<Map<string, WorkOrderItem[]>> {
  const map = new Map<string, WorkOrderItem[]>()
  for (const ids of chunk(unique(workOrderIds))) {
    const rows = await db
      .select({ item: workOrderItem, product })
      .from(workOrderItem)
      .innerJoin(product, eq(workOrderItem.productId, product.id))
      .where(inArray(workOrderItem.workOrderId, ids))

    for (const row of rows) {
      const snapshot = ProductSnapshot.fromDTO({
        productId: row.product.id as UUID,
        productName: row.product.name,
        salePrice: row.product.salePrice,
      })
      const item = WorkOrderItem.fromProductSnapshot(
        snapshot,
        row.item.quantity,
        row.item.priceSnapshot
      )
      const list = map.get(row.item.workOrderId)
      if (list) list.push(item)
      else map.set(row.item.workOrderId, [item])
    }
  }
  return map
}

export async function loadResultsByIds(
  resultIds: (string | null | undefined)[],
  knownRows: WorkOrderResultTable[] = []
): Promise<Map<string, WorkOrderResult>> {
  const ids = unique(resultIds)
  const map = new Map<string, WorkOrderResult>()
  if (ids.length === 0) return map

  const resultRows = new Map<string, WorkOrderResultTable>()
  for (const r of knownRows) resultRows.set(r.id, r)
  const missing = ids.filter((id) => !resultRows.has(id))
  for (const part of chunk(missing)) {
    const rows = await db
      .select()
      .from(workOrderResult)
      .where(inArray(workOrderResult.id, part))
    for (const r of rows) resultRows.set(r.id, r)
  }

  type Buckets = {
    exchanged: WorkOrderResultItem[]
    added: WorkOrderResultItem[]
    removed: WorkOrderResultItem[]
  }
  const buckets = new Map<string, Buckets>()
  for (const part of chunk(ids)) {
    const rows = await db
      .select({ item: workOrderResultItem, product })
      .from(workOrderResultItem)
      .innerJoin(product, eq(workOrderResultItem.productId, product.id))
      .where(inArray(workOrderResultItem.resultId, part))

    for (const row of rows) {
      const snapshot = ProductSnapshot.fromDTO({
        productId: row.product.id as UUID,
        productName: row.product.name,
        salePrice: row.product.salePrice,
      })
      const item = WorkOrderResultItemMapper.toDomain(row.item, snapshot)
      let b = buckets.get(row.item.resultId)
      if (!b) {
        b = { exchanged: [], added: [], removed: [] }
        buckets.set(row.item.resultId, b)
      }
      if (item.type === WorkOrderResultItemType.EXCHANGED)
        b.exchanged.push(item)
      else if (item.type === WorkOrderResultItemType.ADDED) b.added.push(item)
      else if (item.type === WorkOrderResultItemType.REMOVED)
        b.removed.push(item)
    }
  }

  for (const id of ids) {
    const row = resultRows.get(id)
    if (!row) continue
    const b = buckets.get(id) ?? { exchanged: [], added: [], removed: [] }
    map.set(
      id,
      WorkOrderResultMapper.toDomain(row, b.exchanged, b.added, b.removed)
    )
  }
  return map
}

/**
 * Monta as entidades WorkOrder a partir das linhas já unidas com cliente,
 * pagamento e resultado. Linhas sem cliente são descartadas (dado órfão).
 */
export async function hydrateWorkOrders(
  rows: WorkOrderJoinedRow[]
): Promise<WorkOrder[]> {
  const valid = rows.filter((r) => r.customer)
  if (valid.length === 0) return []

  const [itemsMap, resultsMap] = await Promise.all([
    loadItemsByWorkOrderIds(valid.map((r) => r.workOrder.id)),
    loadResultsByIds(
      valid.map((r) => r.workOrder.resultId),
      valid.map((r) => r.result).filter((r): r is WorkOrderResultTable => !!r)
    ),
  ])

  return valid.map((row) => {
    const cust = CustomerMapper.toDomain(row.customer!)
    const po = row.paymentOrder
      ? PaymentOrderMapper.toDomain(row.paymentOrder)
      : undefined
    const result = row.workOrder.resultId
      ? resultsMap.get(row.workOrder.resultId)
      : undefined
    const items = itemsMap.get(row.workOrder.id) ?? []
    return WorkOrderMapper.toDomain(row.workOrder, cust, items, po, result)
  })
}
