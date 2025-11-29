import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { WorkOrderResultItemMapper } from '@/src/domain/entities/work-order-result-item/mapper/work-order-result-item.mapper'
import { WorkOrderResultItem } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderResultItemRepository } from '@/src/domain/repositories/work-order-result-item/work-order-result-item.repository'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { product, workOrderResultItem } from '@/src/infra/db/drizzle/schema'
import { UUID } from '@/src/lib/utils'
import { eq } from 'drizzle-orm'

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

  getWorkOrderResultItemsByResultId(resultId: UUID): Promise<{
    exchanged: WorkOrderResultItem[]
    added: WorkOrderResultItem[]
    removed: WorkOrderResultItem[]
  }> {
    throw new Error('Method not implemented.')
  }

  addWorkOrderResultItem(item: WorkOrderResultItem): Promise<void> {
    throw new Error('Method not implemented.')
  }

  addWorkOrderResultItems(items: WorkOrderResultItem[]): Promise<void> {
    throw new Error('Method not implemented.')
  }

  updateWorkOrderResultItem(item: WorkOrderResultItem): Promise<void> {
    throw new Error('Method not implemented.')
  }

  deleteWorkOrderResultItem(itemId: UUID): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
