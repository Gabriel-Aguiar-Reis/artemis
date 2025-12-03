import { PaymentService } from '@/src/application/services/payment.service'
import { PaymentOrderMapper } from '@/src/domain/entities/payment-order/mapper/payment-order.mapper'
import { PaymentOrder } from '@/src/domain/entities/payment-order/payment-order.entity'
import { PaymentOrderRepository } from '@/src/domain/repositories/payment-order/payment-order.repository'
import {
  PaymentOrderInsertDTO,
  PaymentOrderUpdateDTO,
} from '@/src/domain/validations/payment-order.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { paymentOrder } from '@/src/infra/db/drizzle/schema/drizzle.payment-order.schema'
import { UUID } from '@/src/lib/utils'
import { eq } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzlePaymentOrderRepository
  implements PaymentOrderRepository
{
  async getPaymentOrders(): Promise<PaymentOrder[]> {
    const rows = await db.select().from(paymentOrder)
    if (rows.length === 0) {
      return []
    }
    return rows.map(PaymentOrderMapper.toDomain)
  }

  async addPaymentOrder(dto: PaymentOrderInsertDTO): Promise<UUID> {
    const id = uuid.v4() as UUID

    const po = new PaymentOrder(
      id,
      dto.method,
      dto.totalValue,
      dto.installments ?? 1,
      dto.isPaid ?? false,
      dto.paidInstallments ?? 0
    )

    const data = PaymentOrderMapper.toPersistence(po)
    await db.insert(paymentOrder).values(data).onConflictDoNothing()

    return id
  }

  async updatePaymentOrder(dto: PaymentOrderUpdateDTO): Promise<void> {
    if (dto.id === undefined) {
      throw new Error(
        'ID da ordem de pagamento é obrigatório para atualização.'
      )
    }

    const existing = await this.getPaymentOrder(dto.id as UUID)
    if (!existing) {
      throw new Error('A ordem de pagamento não foi encontrada.')
    }

    const po = PaymentOrder.fromDTO({
      ...dto,
      id: dto.id as UUID,
      isPaid: dto.isPaid ?? false,
    })

    const data = PaymentOrderMapper.toPersistence(po)

    await db.transaction(async (tx) => {
      await tx
        .update(paymentOrder)
        .set({
          method: data.method,
          totalValue: data.totalValue,
          installments: data.installments,
          isPaid: data.isPaid,
          paidInstallments: data.paidInstallments,
        })
        .where(eq(paymentOrder.id, dto.id as UUID))

      if (data.isPaid) {
        await PaymentService.finalizePayment(tx, dto.id as UUID)
      }
    })
  }

  async deletePaymentOrder(id: UUID): Promise<void> {
    await db.delete(paymentOrder).where(eq(paymentOrder.id, id))
  }

  async getPaymentOrder(id: UUID): Promise<PaymentOrder | null> {
    const row = db
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.id, id))
      .limit(1)
      .get()

    if (!row) throw new Error('A ordem de pagamento não foi encontrada.')
    return PaymentOrderMapper.toDomain(row)
  }

  async getUnpaidPaymentOrders(): Promise<PaymentOrder[]> {
    const rows = await db
      .select()
      .from(paymentOrder)
      .where(eq(paymentOrder.isPaid, false))
    return rows.map(PaymentOrderMapper.toDomain)
  }
}
