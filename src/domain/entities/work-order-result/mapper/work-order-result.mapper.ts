import { WorkOrderResultItem } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { WorkOrderResultTable } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result.schema'
import { UUID } from 'crypto'

export class WorkOrderResultMapper {
  static toDomain(
    table: WorkOrderResultTable,
    exchangedProducts: WorkOrderResultItem[],
    addedProducts?: WorkOrderResultItem[],
    removedProducts?: WorkOrderResultItem[]
  ): WorkOrderResult {
    return WorkOrderResult.fromDTO({
      id: table.id as UUID,
      totalValue: table.totalValue,
      exchangedProducts,
      addedProducts,
      removedProducts,
    })
  }

  static toPersistence(entity: WorkOrderResult): WorkOrderResultTable {
    return {
      id: entity.id,
      totalValue: entity.totalValue,
    }
  }
}
