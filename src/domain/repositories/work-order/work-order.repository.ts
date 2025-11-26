import { PaymentOrderSerializableDTO } from '@/src/domain/entities/payment-order/payment-order.entity'
import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import {
  WorkOrderInsertDTO,
  WorkOrderUpdateDTO,
} from '@/src/domain/validations/work-order.schema'
import { UUID } from '@/src/lib/utils'

export abstract class WorkOrderRepository {
  abstract getWorkOrders: () => Promise<WorkOrder[]>
  abstract addWorkOrder: (dto: WorkOrderInsertDTO) => Promise<void>
  abstract updateWorkOrder: (dto: WorkOrderUpdateDTO) => Promise<void>
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
  abstract addCreateFromFinished: (
    originalId: UUID,
    newScheduledDate: Date,
    newPaymentOrder?: PaymentOrderSerializableDTO
  ) => Promise<void>
}
