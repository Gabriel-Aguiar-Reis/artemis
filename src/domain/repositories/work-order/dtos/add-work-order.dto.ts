import { WorkOrderItemSerializableDTO } from '@/src/domain/entities/work-order-item/work-order-item.entity'

export interface AddWorkOrderDto {
  customerId: string
  scheduledDate: string
  paymentMethod: string
  products: WorkOrderItemSerializableDTO[]
  notes?: string
}
