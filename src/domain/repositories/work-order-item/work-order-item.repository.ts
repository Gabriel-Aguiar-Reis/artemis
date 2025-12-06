import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import {
  WorkOrderItemInsertDTO,
  WorkOrderItemUpdateDTO,
} from '@/src/domain/validations/work-order-item.schema'
import { UUID } from '@/src/lib/utils'

export abstract class WorkOrderItemRepository {
  abstract getWorkOrderItem: (id: UUID) => Promise<WorkOrderItem | null>
  abstract getWorkOrderItemsByWorkOrderId: (
    workOrderId: UUID
  ) => Promise<WorkOrderItem[]>
  abstract addWorkOrderItem: (
    item: WorkOrderItemInsertDTO,
    workOrderId: UUID
  ) => Promise<void>
  abstract addWorkOrderItems: (
    items: WorkOrderItemInsertDTO[],
    workOrderId: UUID
  ) => Promise<void>
  abstract updateWorkOrderItem: (
    item: WorkOrderItemUpdateDTO,
    workOrderId: UUID
  ) => Promise<void>
  abstract deleteWorkOrderItem: (id: UUID) => Promise<void>
  abstract deleteWorkOrderItemsByWorkOrderId: (
    workOrderId: UUID
  ) => Promise<void>
}
