import { ProductMapper } from '@/src/domain/entities/product/mapper/product.mapper'
import { WorkOrderItemMapper } from '@/src/domain/entities/work-order-item/mapper/work-order-item.mapper'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import { WorkOrderItemRepository } from '@/src/domain/repositories/work-order-item/work-order-item.repository'
import {
  WorkOrderItemInsertDTO,
  WorkOrderItemUpdateDTO,
} from '@/src/domain/validations/work-order-item.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { product, workOrderItem } from '@/src/infra/db/drizzle/schema'
import { UUID } from '@/src/lib/utils'
import { eq } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzleWorkOrderItemRepository
  implements WorkOrderItemRepository
{
  async getWorkOrderItem(id: UUID): Promise<WorkOrderItem | null> {
    const row = db
      .select()
      .from(workOrderItem)
      .where(eq(workOrderItem.id, id))
      .leftJoin(product, eq(workOrderItem.productId, product.id))
      .limit(1)
      .get()

    if (!row || !row.product) {
      return null
    }

    const prod = ProductMapper.toDomain(row.product)
    const snapshot = ProductSnapshot.fromDTO({
      productId: prod.id,
      productName: prod.name,
      salePrice: prod.salePrice,
    })

    return WorkOrderItemMapper.toDomain(row.work_order_item, snapshot)
  }

  async getWorkOrderItemsByWorkOrderId(
    workOrderId: UUID
  ): Promise<WorkOrderItem[]> {
    const rows = await db
      .select()
      .from(workOrderItem)
      .where(eq(workOrderItem.workOrderId, workOrderId))
      .leftJoin(product, eq(workOrderItem.productId, product.id))

    if (rows.length === 0) {
      return []
    }

    return rows
      .filter((row) => row.product)
      .map((row) => {
        const prod = ProductMapper.toDomain(row.product!)
        const snapshot = ProductSnapshot.fromDTO({
          productId: prod.id,
          productName: prod.name,
          salePrice: prod.salePrice,
        })
        return WorkOrderItemMapper.toDomain(row.work_order_item, snapshot)
      })
  }

  async addWorkOrderItem(
    item: WorkOrderItemInsertDTO,
    workOrderId: UUID
  ): Promise<void> {
    await db
      .insert(workOrderItem)
      .values({
        id: uuid.v4() as UUID,
        workOrderId,
        productId: item.productId,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
      })
      .onConflictDoNothing()
  }

  async addWorkOrderItems(
    items: WorkOrderItemInsertDTO[],
    workOrderId: UUID
  ): Promise<void> {
    if (items.length === 0) return

    const data = items.map((item) => ({
      id: uuid.v4() as UUID,
      workOrderId,
      productId: item.productId,
      quantity: item.quantity,
      priceSnapshot: item.priceSnapshot,
    }))
    await db.insert(workOrderItem).values(data).onConflictDoNothing()
  }

  async updateWorkOrderItem(
    item: WorkOrderItemUpdateDTO,
    workOrderId: UUID
  ): Promise<void> {
    if (!item.id) {
      throw new Error('ID é obrigatório para atualizar um item')
    }

    await db
      .update(workOrderItem)
      .set({
        workOrderId,
        productId: item.productId,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
      })
      .where(eq(workOrderItem.id, item.id))
  }

  async deleteWorkOrderItem(id: UUID): Promise<void> {
    await db.delete(workOrderItem).where(eq(workOrderItem.id, id))
  }

  async deleteWorkOrderItemsByWorkOrderId(workOrderId: UUID): Promise<void> {
    await db
      .delete(workOrderItem)
      .where(eq(workOrderItem.workOrderId, workOrderId))
  }
}
