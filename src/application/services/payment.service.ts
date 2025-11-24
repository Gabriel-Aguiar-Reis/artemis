import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { PaymentOrderMapper } from '@/src/domain/entities/payment-order/mapper/payment-order.mapper'
import {
  WorkOrder,
  WorkOrderStatus,
} from '@/src/domain/entities/work-order/work-order.entity'
import { paymentOrder } from '@/src/infra/db/drizzle/schema'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { product } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import { workOrderItems } from '@/src/infra/db/drizzle/schema/drizzle.work-order-items.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { UUID } from 'crypto'
import { eq, ExtractTablesWithRelations } from 'drizzle-orm'
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core'
import { SQLiteRunResult } from 'expo-sqlite'

export class PaymentService {
  static async finalizePayment(
    tx: SQLiteTransaction<
      'sync',
      SQLiteRunResult,
      Record<string, unknown>,
      ExtractTablesWithRelations<Record<string, unknown>>
    >,
    paymentOrderId: string
  ) {
    // Buscar a work order vinculada ao paymentOrder
    const workOrders = await tx
      .select()
      .from(workOrder)
      .where(eq(workOrder.paymentOrderId, paymentOrderId))
      .limit(1)

    const wo = workOrders[0]
    if (!wo)
      throw new Error(
        'Ordem de serviço vinculada à ordem de pagamento não encontrada.'
      )

    // Certificar que cliente existe
    const customers = await tx
      .select()
      .from(customer)
      .where(eq(customer.id, wo.customerId))
      .limit(1)

    const cust = customers[0]
    if (!cust)
      throw new Error('Cliente vinculado à ordem de serviço não encontrado.')

    // Verificar existência de items (apenas validação)
    const items = await tx
      .select({ item: workOrderItems, product: product })
      .from(workOrderItems)
      .leftJoin(product, eq(workOrderItems.productId, product.id))
      .where(eq(workOrderItems.workOrderId, wo.id))

    if (!items || items.length === 0)
      throw new Error('Itens da ordem de serviço não encontrados.')

    const pos = await tx
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.id, paymentOrderId))
      .limit(1)

    if (pos.length === 0)
      throw new Error(
        'Ordem de pagamento não encontrada para a ordem de serviço.'
      )

    const po = PaymentOrderMapper.toDomain(pos[0])

    const newWo = WorkOrder.fromDTO({
      id: wo.id as UUID,
      customer: CustomerMapper.toDomain(cust),
      createdAt: wo.createdAt ?? new Date().toISOString(),
      updatedAt: wo.updatedAt ?? new Date().toISOString(),
      scheduledDate: wo.scheduledDate,
      paymentOrder: po,
      products: items.map((r) => ({
        productId: r.item.productId as UUID,
        quantity: r.item.quantity,
        productName: r.product?.name ?? '',
        salePrice: r.product?.salePrice ?? 0,
      })),
      status: WorkOrderStatus.COMPLETED,
      visitDate: wo.visitDate ?? undefined,
      notes: wo.notes ?? undefined,
    })

    const status = newWo.finalizeAfterPayment()

    await tx
      .update(workOrder)
      .set({ status })
      .where(eq(workOrder.paymentOrderId, paymentOrderId))
  }
}
