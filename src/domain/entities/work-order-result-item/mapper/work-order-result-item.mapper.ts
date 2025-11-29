import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { WorkOrderResultItem } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderResultItemTable } from '@/src/infra/db/drizzle/schema'
import { UUID } from '@/src/lib/utils'

export class WorkOrderResultItemMapper {
  static toDomain(
    table: WorkOrderResultItemTable,
    product: ProductSnapshot
  ): WorkOrderResultItem {
    return WorkOrderResultItem.fromDTO({
      id: table.id as UUID,
      productId: product.productId as UUID,
      resultId: table.resultId as UUID,
      productName: product.productName,
      salePrice: product.salePrice,
      quantity: table.quantity,
      type: table.type,
      observation: table.observation || undefined,
    })
  }
}
