import { WorkOrderResultItem } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { UUID } from '@/src/lib/utils'

export abstract class WorkOrderResultItemRepository {
  abstract getWorkOrderResultItem(id: UUID): Promise<WorkOrderResultItem>
  abstract getWorkOrderResultItemsByResultId(resultId: UUID): Promise<{
    exchanged: WorkOrderResultItem[]
    added: WorkOrderResultItem[]
    removed: WorkOrderResultItem[]
  }>
  abstract addWorkOrderResultItem(item: WorkOrderResultItem): Promise<void>
  abstract addWorkOrderResultItems(items: WorkOrderResultItem[]): Promise<void>
  abstract updateWorkOrderResultItem(item: WorkOrderResultItem): Promise<void>
  abstract deleteWorkOrderResultItem(itemId: UUID): Promise<void>
}
