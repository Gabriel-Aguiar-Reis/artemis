import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { WorkOrderResultItemMapper } from '@/src/domain/entities/work-order-result-item/mapper/work-order-result-item.mapper'
import { WorkOrderResultItem } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderResultItemRepository } from '@/src/domain/repositories/work-order-result-item/work-order-result-item.repository'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { product, workOrderResultItem } from '@/src/infra/db/drizzle/schema'
import { UUID } from '@/src/lib/utils'
import { eq } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export class DrizzleWorkOrderResultItemRepository
  implements WorkOrderResultItemRepository
{
  async getWorkOrderResultItem(id: UUID): Promise<WorkOrderResultItem> {
    const [row] = await db
      .select()
      .from(workOrderResultItem)
      .where(eq(workOrderResultItem.id, id))
      .leftJoin(product, eq(workOrderResultItem.productId, product.id))

    if (!row.work_order_result_item) {
      throw new Error(
        'O item do relatório de ordem de serviço não foi encontrado.'
      )
    }

    if (!row.product) {
      throw new Error('Produto vinculado ao item não foi encontrado.')
    }

    const snap = ProductSnapshot.fromDTO({
      productId: row.product.id as UUID,
      productName: row.product.name,
      salePrice: row.product.salePrice,
    })

    return WorkOrderResultItemMapper.toDomain(row.work_order_result_item, snap)
  }

  async getWorkOrderResultItemsByResultId(resultId: UUID): Promise<{
    exchanged: WorkOrderResultItem[]
    added: WorkOrderResultItem[]
    removed: WorkOrderResultItem[]
  }> {
    const rows = await db
      .select()
      .from(workOrderResultItem)
      .where(eq(workOrderResultItem.resultId, resultId))
      .leftJoin(product, eq(workOrderResultItem.productId, product.id))

    const exchanged: WorkOrderResultItem[] = []
    const added: WorkOrderResultItem[] = []
    const removed: WorkOrderResultItem[] = []

    if (!rows.length) {
      return { exchanged, added, removed }
    }

    rows.forEach((row) => {
      if (!row.work_order_result_item) {
        throw new Error(
          'O item do relatório de ordem de serviço não foi encontrado.'
        )
      }

      if (!row.product) {
        throw new Error('Produto vinculado ao item não foi encontrado.')
      }

      const snap = ProductSnapshot.fromDTO({
        productId: row.product.id as UUID,
        productName: row.product.name,
        salePrice: row.product.salePrice,
      })

      const item = WorkOrderResultItemMapper.toDomain(
        row.work_order_result_item,
        snap
      )

      switch (row.work_order_result_item.type) {
        case 'EXCHANGED':
          exchanged.push(item)
          break
        case 'ADDED':
          added.push(item)
          break
        case 'REMOVED':
          removed.push(item)
          break
      }
    })

    return { exchanged, added, removed }
  }

  async addWorkOrderResultItem(item: WorkOrderResultItem): Promise<void> {
    const id = uuid.v4()
    const data = WorkOrderResultItemMapper.toPersistence(item)
    await db.insert(workOrderResultItem).values(data).onConflictDoNothing()
  }

  async addWorkOrderResultItems(items: WorkOrderResultItem[]): Promise<void> {
    const data = items.map((item) => {
      const id = uuid.v4()
      return WorkOrderResultItemMapper.toPersistence(item)
    })
    await db.insert(workOrderResultItem).values(data).onConflictDoNothing()
  }

  async updateWorkOrderResultItem(item: WorkOrderResultItem): Promise<void> {
    const data = WorkOrderResultItemMapper.toPersistence(item)
    await db
      .update(workOrderResultItem)
      .set(data)
      .where(eq(workOrderResultItem.id, item.id))
      .execute()
  }

  async deleteWorkOrderResultItem(itemId: UUID): Promise<void> {
    await db
      .delete(workOrderResultItem)
      .where(eq(workOrderResultItem.id, itemId))
      .execute()
  }
}
