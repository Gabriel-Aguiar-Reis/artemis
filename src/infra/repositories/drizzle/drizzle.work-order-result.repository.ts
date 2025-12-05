import { ProductMapper } from '@/src/domain/entities/product/mapper/product.mapper'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { WorkOrderResultItem } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderResultMapper } from '@/src/domain/entities/work-order-result/mapper/work-order-result.mapper'
import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { WorkOrderResultRepository } from '@/src/domain/repositories/work-order-result/work-order-result.repository'
import {
  WorkOrderResultInsertDTO,
  WorkOrderResultUpdateDTO,
} from '@/src/domain/validations/work-order-result.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import {
  product,
  workOrder,
  workOrderResult,
  workOrderResultItem,
} from '@/src/infra/db/drizzle/schema'
import { UUID } from '@/src/lib/utils'
import { eq } from 'drizzle-orm'

export default class DrizzleWorkOrderResultRepository implements WorkOrderResultRepository {
  private async loadWorkOrderResultItems(
    resultId: UUID
  ): Promise<WorkOrderResultItem[]> {
    const items = await db
      .select({
        item: workOrderResultItem,
        product: product,
      })
      .from(workOrderResultItem)
      .leftJoin(product, eq(workOrderResultItem.productId, product.id))
      .where(eq(workOrderResultItem.resultId, resultId))

    if (!items.length) {
      return []
    }

    return items
      .filter((row) => row.product)
      .map((row) => {
        const prod = ProductMapper.toDomain(row.product!)
        const snapshot = ProductSnapshot.fromDTO({
          productId: prod.id,
          productName: prod.name,
          salePrice: prod.salePrice,
        })
        return WorkOrderResultItem.fromProductSnapshot(
          row.item.id as UUID,
          snapshot,
          row.item.resultId as UUID,
          row.item.quantity,
          row.item.type,
          row.item.priceSnapshot,
          row.item.observation ?? undefined
        )
      })
  }

  async getWorkOrderResult(id: UUID): Promise<WorkOrderResult> {
    const row = db
      .select()
      .from(workOrderResult)
      .where(eq(workOrderResult.id, id))
      .limit(1)
      .get()

    if (!row) throw new Error('Resultado da ordem de serviço não encontrado.')

    const items = await this.loadWorkOrderResultItems(row.id as UUID)

    return WorkOrderResult.fromDTO({
      id: row.id as UUID,
      totalValue: row.totalValue,
      items,
    })
  }

  async getWorkOrderResultByWorkOrderId(
    workOrderId: UUID
  ): Promise<WorkOrderResult> {
    const row = db
      .select()
      .from(workOrderResult)
      .where(eq(workOrderResult.id, workOrderId))
      .limit(1)
      .get()

    if (!row) throw new Error('Ordem de serviço não encontrada.')

    const items = await this.loadWorkOrderResultItems(row.id as UUID)

    return WorkOrderResult.fromDTO({
      id: row.id as UUID,
      totalValue: row.totalValue,
      items,
    })
  }

  async addWorkOrderResult(result: WorkOrderResultInsertDTO): Promise<void> {
    const res = WorkOrderResult.fromDTO({
      id: result.id as UUID,
      totalValue: result.totalValue,
    })
    const data = WorkOrderResultMapper.toPersistence(res)
    await db.insert(workOrderResult).values(data).onConflictDoNothing()
  }

  async updateWorkOrderResult(result: WorkOrderResultUpdateDTO): Promise<void> {
    const existing = await this.getWorkOrderResult(result.id as UUID)

    if (!existing)
      throw new Error('Relatório final da ordem de serviço não encontrado.')

    const res = WorkOrderResult.fromDTO({
      id: existing.id as UUID,
      totalValue: existing.totalValue,
    })
    const data = WorkOrderResultMapper.toPersistence(res)
    await db
      .update(workOrderResult)
      .set(data)
      .where(eq(workOrderResult.id, res.id))
  }

  async deleteWorkOrderResult(resultId: UUID): Promise<void> {
    const existing = await this.getWorkOrderResult(resultId)

    if (!existing)
      throw new Error('Relatório final da ordem de serviço não encontrado.')

    await db.transaction(async (tx) => {
      // Deletar items do resultado primeiro
      await tx
        .delete(workOrderResultItem)
        .where(eq(workOrderResultItem.resultId, resultId))

      // Remover referência em work orders
      await tx
        .update(workOrder)
        .set({ resultId: null })
        .where(eq(workOrder.resultId, resultId))

      // Deletar resultado
      await tx.delete(workOrderResult).where(eq(workOrderResult.id, resultId))
    })
  }
}
