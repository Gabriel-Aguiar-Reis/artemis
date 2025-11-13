import { WorkOrderItemSerializableDTO } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'

export interface UpdateWorkOrderDto {
  id: string
  customerId: string
  scheduledDate: string
  products: WorkOrderItemSerializableDTO[]
  status: WorkOrderStatus
  notes?: string
}
