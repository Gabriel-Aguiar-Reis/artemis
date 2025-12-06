import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import { WorkOrderItemTable } from '@/src/infra/db/drizzle/schema'
import { UUID } from '@/src/lib/utils'

export class WorkOrderItemMapper {
  static toDomain(
    raw: WorkOrderItemTable,
    productSnapshot: ProductSnapshot
  ): WorkOrderItem {
    return new WorkOrderItem(
      raw.id as UUID,
      productSnapshot,
      raw.quantity,
      raw.priceSnapshot
    )
  }

  static toPersistence(
    item: WorkOrderItem,
    workOrderId: UUID
  ): {
    id: string
    workOrderId: string
    productId: string
    quantity: number
    priceSnapshot: number
  } {
    return {
      id: item.id as string,
      workOrderId,
      productId: item.productId,
      quantity: item.quantity,
      priceSnapshot: item.priceSnapshot,
    }
  }
}
