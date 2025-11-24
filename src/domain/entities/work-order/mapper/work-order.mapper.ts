import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { PaymentOrder } from '@/src/domain/entities/payment-order/payment-order.entity'
import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import {
  WorkOrder,
  WorkOrderStatus,
} from '@/src/domain/entities/work-order/work-order.entity'
import { WorkOrderTable } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { UUID } from 'crypto'

export class WorkOrderMapper {
  static toDomain(
    table: WorkOrderTable,
    customer: Customer,
    items: WorkOrderItem[],
    paymentOrder?: PaymentOrder,
    result?: WorkOrderResult
  ): WorkOrder {
    return new WorkOrder(
      table.id as UUID,
      customer,
      table.createdAt ? new Date(table.createdAt) : new Date(),
      table.updatedAt ? new Date(table.updatedAt) : new Date(),
      table.scheduledDate ? new Date(table.scheduledDate) : new Date(),
      paymentOrder ?? undefined,
      items,
      table.status as WorkOrderStatus,
      result,
      table.visitDate ? new Date(table.visitDate) : undefined,
      table.notes ?? undefined
    )
  }

  static toPersistence(entity: WorkOrder): WorkOrderTable {
    return {
      id: entity.id,
      customerId: entity.customer.id,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      scheduledDate: entity.scheduledDate.toISOString(),
      visitDate: entity.visitDate?.toISOString() ?? null,
      paymentOrderId: entity.paymentOrder ? entity.paymentOrder.id : null,
      status: entity.status,
      resultId: entity.result?.id ?? null,
      notes: entity.notes ?? null,
    }
  }
}
