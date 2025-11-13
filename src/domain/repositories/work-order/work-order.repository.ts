import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { AddWorkOrderDto } from '@/src/domain/repositories/work-order/dtos/add-work-order.dto'
import { UpdateWorkOrderDto } from '@/src/domain/repositories/work-order/dtos/update-work-order.dto'
import { UUID } from 'crypto'

export abstract class WorkOrderRepository {
  abstract getWorkOrders: () => Promise<WorkOrder[]>
  abstract addWorkOrder: (dto: AddWorkOrderDto) => Promise<void>
  abstract updateWorkOrder: (dto: UpdateWorkOrderDto) => Promise<void>
  abstract updateWorkOrderStart: (id: UUID) => Promise<void>
  abstract updateWorkOrderFinish: (
    id: UUID,
    result: WorkOrderResult
  ) => Promise<void>
  abstract deleteWorkOrder: (id: UUID) => Promise<void>
  abstract getWorkOrder: (id: UUID) => Promise<WorkOrder | null>
  abstract getWorkOrdersByCustomer: (customerId: UUID) => Promise<WorkOrder[]>
  abstract getPendingWorkOrders: () => Promise<WorkOrder[]>
  abstract getWorkOrdersByDate: (date: Date) => Promise<WorkOrder[]>
}
