import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { PaymentOrderMapper } from '@/src/domain/entities/payment-order/mapper/payment-order.mapper'
import { ProductMapper } from '@/src/domain/entities/product/mapper/product.mapper'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import { WorkOrderResultMapper } from '@/src/domain/entities/work-order-result/mapper/work-order-result.mapper'
import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { WorkOrderMapper } from '@/src/domain/entities/work-order/mapper/work-order.mapper'
import {
  WorkOrder,
  WorkOrderStatus,
} from '@/src/domain/entities/work-order/work-order.entity'
import { WorkOrderRepository } from '@/src/domain/repositories/work-order/work-order.repository'
import {
  WorkOrderInsertDTO,
  WorkOrderUpdateDTO,
} from '@/src/domain/validations/work-order.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { paymentOrder } from '@/src/infra/db/drizzle/schema/drizzle.payment-order.schema'
import { product } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import { workOrderItems } from '@/src/infra/db/drizzle/schema/drizzle.work-order-items.schema'
import {
  WorkOrderResultItemType,
  workOrderResultItems,
} from '@/src/infra/db/drizzle/schema/drizzle.work-order-result-items.schema'
import { workOrderResult } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzleWorkOrderRepository implements WorkOrderRepository {
  private async loadWorkOrderItems(
    workOrderId: UUID
  ): Promise<WorkOrderItem[]> {
    const items = await db
      .select({
        item: workOrderItems,
        product: product,
      })
      .from(workOrderItems)
      .leftJoin(product, eq(workOrderItems.productId, product.id))
      .where(eq(workOrderItems.workOrderId, workOrderId))

    return items
      .filter((row) => row.product)
      .map((row) => {
        const prod = ProductMapper.toDomain(row.product!)
        const snapshot = ProductSnapshot.fromDTO({
          productId: prod.id,
          productName: prod.name,
          salePrice: prod.salePrice,
        })
        return WorkOrderItem.fromProductSnapshot(
          snapshot,
          row.item.quantity,
          row.item.priceSnapshot
        )
      })
  }

  async getWorkOrders(): Promise<WorkOrder[]> {
    const rows = await db
      .select({
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
      })
      .from(workOrder)
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))

    if (rows.length === 0) {
      return []
    }

    const workOrders = await Promise.all(
      rows.map(async (row) => {
        if (!row.customer || !row.paymentOrder) {
          throw new Error('A ordem de serviço está com dados incompletos.')
        }
        const cust = CustomerMapper.toDomain(row.customer)
        const po = PaymentOrderMapper.toDomain(row.paymentOrder)
        const items = await this.loadWorkOrderItems(row.workOrder.id as UUID)
        return WorkOrderMapper.toDomain(row.workOrder, cust, po, items)
      })
    )

    return workOrders
  }

  async addWorkOrder(dto: WorkOrderInsertDTO): Promise<void> {
    const id = uuid.v4() as UUID

    // Buscar customer
    const [customerRow] = await db
      .select()
      .from(customer)
      .where(eq(customer.id, dto.customerId))

    if (!customerRow) {
      throw new Error('O cliente não foi encontrado.')
    }

    const cust = CustomerMapper.toDomain(customerRow)

    const wo = new WorkOrder(
      id,
      cust,
      new Date(),
      new Date(),
      new Date(dto.scheduledDate),
      undefined,
      [],
      WorkOrderStatus.PENDING,
      undefined,
      undefined,
      dto.notes ?? undefined
    )

    const data = WorkOrderMapper.toPersistence(wo)

    await db.insert(workOrder).values(data).onConflictDoNothing()
  }

  async updateWorkOrder(dto: WorkOrderUpdateDTO): Promise<void> {
    const wo = await this.getWorkOrder(dto.id as UUID)
    if (!wo) {
      throw new Error('A ordem de serviço não foi encontrada.')
    }

    // Atualizar customer se mudou
    if (dto.customerId && dto.customerId !== wo.customer.id) {
      const [customerRow] = await db
        .select()
        .from(customer)
        .where(eq(customer.id, dto.customerId))

      if (!customerRow) {
        throw new Error('O cliente não foi encontrado.')
      }

      wo.customer = CustomerMapper.toDomain(customerRow)
    }

    // Atualizar data agendada
    if (dto.scheduledDate) {
      wo.scheduledDate = new Date(dto.scheduledDate)
    }

    // Atualizar data de visita
    if (dto.visitDate) {
      wo.visitDate = new Date(dto.visitDate)
    }

    // Usar setStatus()
    if (dto.status && dto.status !== wo.status) {
      wo.setStatus(dto.status)
    }

    // Atualizar notas
    if (dto.notes) {
      wo.notes = dto.notes
    }

    wo.updatedAt = new Date()

    const data = WorkOrderMapper.toPersistence(wo)

    await db.insert(workOrder).values(data).onConflictDoNothing()
  }

  async updateWorkOrderStart(id: UUID): Promise<void> {
    const wo = await this.getWorkOrder(id)
    if (!wo) {
      throw new Error('A ordem de serviço não foi encontrada.')
    }

    wo.startVisit()

    const data = WorkOrderMapper.toPersistence(wo)
    await db
      .update(workOrder)
      .set({
        status: data.status,
        visitDate: data.visitDate,
        updatedAt: data.updatedAt,
      })
      .where(eq(workOrder.id, id))
  }

  async updateWorkOrderFinish(
    id: UUID,
    result: WorkOrderResult
  ): Promise<void> {
    const wo = await this.getWorkOrder(id)
    if (!wo) {
      throw new Error('A ordem de serviço não foi encontrada.')
    }

    wo.applyResult(result)
    wo.syncPaymentWithResult()

    const woData = WorkOrderMapper.toPersistence(wo)

    await db.transaction(async (tx) => {
      // Salvar resultado primeiro
      await tx
        .insert(workOrderResult)
        .values(WorkOrderResultMapper.toPersistence(result))
        .onConflictDoNothing()

      // Salvar items do resultado
      if (result.exchangedProducts) {
        for (const item of result.exchangedProducts) {
          await tx.insert(workOrderResultItems).values({
            id: uuid.v4() as string,
            resultId: result.id,
            productId: item.productId,
            quantity: item.quantity,
            priceSnapshot: item.salePrice,
            type: WorkOrderResultItemType.EXCHANGED,
            observation: item.observation ?? null,
          })
        }
      }

      if (result.addedProducts) {
        for (const item of result.addedProducts) {
          await tx.insert(workOrderResultItems).values({
            id: uuid.v4() as string,
            resultId: result.id,
            productId: item.productId,
            quantity: item.quantity,
            priceSnapshot: item.salePrice,
            type: WorkOrderResultItemType.ADDED,
            observation: item.observation ?? null,
          })
        }
      }

      if (result.removedProducts) {
        for (const item of result.removedProducts) {
          await tx.insert(workOrderResultItems).values({
            id: uuid.v4() as string,
            resultId: result.id,
            productId: item.productId,
            quantity: item.quantity,
            priceSnapshot: item.salePrice,
            type: WorkOrderResultItemType.REMOVED,
            observation: item.observation ?? null,
          })
        }
      }

      // Atualizar work order
      await tx
        .update(workOrder)
        .set({
          status: woData.status,
          resultId: result.id,
          updatedAt: woData.updatedAt,
        })
        .where(eq(workOrder.id, id))
    })
  }

  async deleteWorkOrder(id: UUID): Promise<void> {
    const [woRow] = await db
      .select()
      .from(workOrder)
      .where(eq(workOrder.id, id))

    if (woRow) {
      await db.transaction(async (tx) => {
        // Deletar items (cascade)
        await tx
          .delete(workOrderItems)
          .where(eq(workOrderItems.workOrderId, id))

        // Deletar work order
        await tx.delete(workOrder).where(eq(workOrder.id, id))
      })
    }
  }

  async getWorkOrder(id: UUID): Promise<WorkOrder | null> {
    const [row] = await db
      .select({
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
      })
      .from(workOrder)
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .where(eq(workOrder.id, id))

    if (!row || !row.customer || !row.paymentOrder) {
      return null
    }

    const cust = CustomerMapper.toDomain(row.customer)
    const po = PaymentOrderMapper.toDomain(row.paymentOrder)
    const items = await this.loadWorkOrderItems(id)
    return WorkOrderMapper.toDomain(row.workOrder, cust, po, items)
  }

  async getWorkOrdersByCustomer(customerId: UUID): Promise<WorkOrder[]> {
    const rows = await db
      .select({
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
      })
      .from(workOrder)
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .where(eq(workOrder.customerId, customerId))

    const workOrders = await Promise.all(
      rows
        .filter((row) => row.customer && row.paymentOrder)
        .map(async (row) => {
          const cust = CustomerMapper.toDomain(row.customer!)
          const po = PaymentOrderMapper.toDomain(row.paymentOrder!)
          const items = await this.loadWorkOrderItems(row.workOrder.id as UUID)
          return WorkOrderMapper.toDomain(row.workOrder, cust, po, items)
        })
    )

    return workOrders
  }

  async getPendingWorkOrders(): Promise<WorkOrder[]> {
    const rows = await db
      .select({
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
      })
      .from(workOrder)
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .where(eq(workOrder.status, WorkOrderStatus.PENDING))

    const workOrders = await Promise.all(
      rows
        .filter((row) => row.customer && row.paymentOrder)
        .map(async (row) => {
          const cust = CustomerMapper.toDomain(row.customer!)
          const po = PaymentOrderMapper.toDomain(row.paymentOrder!)
          const items = await this.loadWorkOrderItems(row.workOrder.id as UUID)
          return WorkOrderMapper.toDomain(row.workOrder, cust, po, items)
        })
    )

    return workOrders
  }

  async getWorkOrdersByDate(date: Date): Promise<WorkOrder[]> {
    const dateStr = date.toISOString().split('T')[0]

    const rows = await db
      .select({
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
      })
      .from(workOrder)
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))

    const filtered = rows.filter((row) =>
      row.workOrder.scheduledDate.startsWith(dateStr)
    )

    const workOrders = await Promise.all(
      filtered
        .filter((row) => row.customer && row.paymentOrder)
        .map(async (row) => {
          const cust = CustomerMapper.toDomain(row.customer!)
          const po = PaymentOrderMapper.toDomain(row.paymentOrder!)
          const items = await this.loadWorkOrderItems(row.workOrder.id as UUID)
          return WorkOrderMapper.toDomain(row.workOrder, cust, po, items)
        })
    )

    return workOrders
  }
}
