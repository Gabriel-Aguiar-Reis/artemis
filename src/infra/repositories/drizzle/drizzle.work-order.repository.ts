import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { PaymentOrderMapper } from '@/src/domain/entities/payment-order/mapper/payment-order.mapper'
import { PaymentOrderSerializableDTO } from '@/src/domain/entities/payment-order/payment-order.entity'
import { ProductMapper } from '@/src/domain/entities/product/mapper/product.mapper'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import { WorkOrderResultItemType } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
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
import { workOrderItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-item.schema'
import { workOrderResultItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result-item.schema'
import { workOrderResult } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { UUID } from '@/src/lib/utils'
import { eq } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzleWorkOrderRepository implements WorkOrderRepository {
  private async loadWorkOrderItems(
    workOrderId: UUID
  ): Promise<WorkOrderItem[]> {
    const items = await db
      .select({
        item: workOrderItem,
        product: product,
      })
      .from(workOrderItem)
      .leftJoin(product, eq(workOrderItem.productId, product.id))
      .where(eq(workOrderItem.workOrderId, workOrderId))

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
        if (!row.customer) {
          throw new Error(
            'A ordem de serviço está com dados incompletos: cliente ausente.'
          )
        }
        const cust = CustomerMapper.toDomain(row.customer)
        const po = row.paymentOrder
          ? PaymentOrderMapper.toDomain(row.paymentOrder)
          : undefined
        const items = await this.loadWorkOrderItems(row.workOrder.id as UUID)
        if (!po) return WorkOrderMapper.toDomain(row.workOrder, cust, items)
        return WorkOrderMapper.toDomain(row.workOrder, cust, items, po)
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
    // Se caller passou paymentOrderId (Opção B), utilizar
    if ((dto as any).paymentOrderId) {
      data.paymentOrderId = (dto as any).paymentOrderId as string
    }

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
          await tx.insert(workOrderResultItem).values({
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
          await tx.insert(workOrderResultItem).values({
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
          await tx.insert(workOrderResultItem).values({
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

      // Criar ou atualizar payment order, se aplicável
      if (wo.paymentOrder) {
        const poData = PaymentOrderMapper.toPersistence(wo.paymentOrder)
        await tx
          .update(paymentOrder)
          .set(poData)
          .where(eq(paymentOrder.id, wo.paymentOrder.id))
      } else if (result.totalValue > 0) {
        const newPoId = uuid.v4() as string
        await tx.insert(paymentOrder).values({
          id: newPoId,
          method: 'Dinheiro',
          totalValue: result.totalValue,
          installments: 1,
          isPaid: false,
          paidInstallments: 0,
        })
        // set payment_order_id on work order persistence object
        woData.paymentOrderId = newPoId
      }

      // Atualizar work order
      await tx
        .update(workOrder)
        .set({
          status: woData.status,
          resultId: result.id,
          paymentOrderId: woData.paymentOrderId,
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
        await tx.delete(workOrderItem).where(eq(workOrderItem.workOrderId, id))

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

    if (!row || !row.customer) {
      return null
    }

    const cust = CustomerMapper.toDomain(row.customer)
    const po = row.paymentOrder
      ? PaymentOrderMapper.toDomain(row.paymentOrder)
      : undefined
    const items = await this.loadWorkOrderItems(id)
    return WorkOrderMapper.toDomain(row.workOrder, cust, items, po)
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
        .filter((row) => row.customer)
        .map(async (row) => {
          const cust = CustomerMapper.toDomain(row.customer!)
          const po = row.paymentOrder
            ? PaymentOrderMapper.toDomain(row.paymentOrder)
            : undefined
          const items = await this.loadWorkOrderItems(row.workOrder.id as UUID)
          return WorkOrderMapper.toDomain(row.workOrder, cust, items, po)
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
        .filter((row) => row.customer)
        .map(async (row) => {
          const cust = CustomerMapper.toDomain(row.customer!)
          const po = row.paymentOrder
            ? PaymentOrderMapper.toDomain(row.paymentOrder)
            : undefined
          const items = await this.loadWorkOrderItems(row.workOrder.id as UUID)
          return WorkOrderMapper.toDomain(row.workOrder, cust, items, po)
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
        .filter((row) => row.customer)
        .map(async (row) => {
          const cust = CustomerMapper.toDomain(row.customer!)
          const po = row.paymentOrder
            ? PaymentOrderMapper.toDomain(row.paymentOrder)
            : undefined
          const items = await this.loadWorkOrderItems(row.workOrder.id as UUID)
          return WorkOrderMapper.toDomain(row.workOrder, cust, items, po)
        })
    )

    return workOrders
  }

  async addCreateFromFinished(
    originalId: UUID,
    newScheduledDate: Date,
    newPaymentOrder?: PaymentOrderSerializableDTO
  ): Promise<void> {
    const original = await this.getWorkOrder(originalId)
    if (!original) throw new Error('Ordem de serviço original não encontrada.')

    if (
      original.status !== WorkOrderStatus.COMPLETED &&
      original.status !== WorkOrderStatus.PARTIAL
    ) {
      throw new Error(
        'Só é possível criar nova OS a partir de uma OS finalizada ou parcial.'
      )
    }

    // Criar payment order se fornecido
    await db.transaction(async (tx) => {
      let paymentOrderId: UUID | null = null
      if (newPaymentOrder) {
        paymentOrderId = String(uuid.v4()) as UUID
        try {
          await tx
            .insert(paymentOrder)
            .values({
              id: paymentOrderId,
              method: newPaymentOrder.method,
              totalValue: newPaymentOrder.totalValue,
              installments: newPaymentOrder.installments ?? 1,
              isPaid: false,
              paidInstallments: 0,
            })
            .onConflictDoNothing()
        } catch {
          throw new Error('Falha ao criar a ordem de pagamento.')
        }
      }

      const newWo = original.createFromResult(newScheduledDate, newPaymentOrder)

      const newWoData = WorkOrderMapper.toPersistence(newWo)

      try {
        await tx.insert(workOrder).values(newWoData).onConflictDoNothing()
      } catch {
        throw new Error('Falha ao criar a nova ordem de serviço.')
      }

      // inserir items
      for (const item of newWo.products) {
        try {
          await tx.insert(workOrderItem).values({
            id: String(uuid.v4()),
            workOrderId: newWo.id,
            productId: item.productId,
            quantity: item.quantity,
            priceSnapshot: item.priceSnapshot,
          })
        } catch {
          throw new Error('Falha ao criar os itens da nova ordem de serviço.')
        }
      }
    })
  }
}
