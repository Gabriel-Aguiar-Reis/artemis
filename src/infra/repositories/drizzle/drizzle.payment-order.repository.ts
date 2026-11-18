import { PaymentService } from '@/src/application/services/payment.service'
import { PaymentOrderMapper } from '@/src/domain/entities/payment-order/mapper/payment-order.mapper'
import { PaymentOrder } from '@/src/domain/entities/payment-order/payment-order.entity'
import {
  normalizePaymentState,
  roundMoney,
} from '@/src/domain/entities/work-order/work-order-rules'
import { PaymentOrderRepository } from '@/src/domain/repositories/payment-order/payment-order.repository'
import {
  PaymentOrderInsertDTO,
  PaymentOrderUpdateDTO,
} from '@/src/domain/validations/payment-order.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { paymentOrder } from '@/src/infra/db/drizzle/schema/drizzle.payment-order.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { UUID } from '@/src/lib/utils'
import { eq } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzlePaymentOrderRepository implements PaymentOrderRepository {
  async getPaymentOrders(): Promise<PaymentOrder[]> {
    const rows = await db.select().from(paymentOrder)
    if (rows.length === 0) {
      return []
    }
    return rows.map(PaymentOrderMapper.toDomain)
  }

  async addPaymentOrder(dto: PaymentOrderInsertDTO): Promise<UUID> {
    const id = (dto.id as UUID) || (uuid.v4() as UUID)

    const state = normalizePaymentState({
      installments:
        dto.installments !== undefined && dto.installments !== null
          ? Number(dto.installments)
          : 1,
      paidInstallments:
        dto.paidInstallments !== undefined && dto.paidInstallments !== null
          ? Number(dto.paidInstallments)
          : 0,
      isPaid: dto.isPaid ?? false,
    })

    const po = new PaymentOrder(
      id,
      dto.method,
      roundMoney(
        dto.totalValue !== undefined && dto.totalValue !== null
          ? Number(dto.totalValue)
          : 0
      ),
      state.installments,
      state.isPaid,
      state.paidInstallments,
      dto.paymentDate instanceof Date
        ? dto.paymentDate
        : dto.paymentDate
          ? new Date(dto.paymentDate)
          : null
    )

    const data = PaymentOrderMapper.toPersistence(po)

    db.transaction((tx) => {
      tx.insert(paymentOrder).values(data).onConflictDoNothing().run()
    })

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

    const state = normalizePaymentState({
      installments:
        dto.installments !== undefined && dto.installments !== null
          ? Number(dto.installments)
          : existing.installments,
      paidInstallments:
        dto.paidInstallments !== undefined && dto.paidInstallments !== null
          ? Number(dto.paidInstallments)
          : existing.paidInstallments,
      isPaid: dto.isPaid ?? existing.isPaid,
    })

    const po = PaymentOrder.fromDTO({
      id: dto.id as UUID,
      method: dto.method ?? existing.method,
      totalValue: roundMoney(
        dto.totalValue !== undefined && dto.totalValue !== null
          ? Number(dto.totalValue)
          : existing.totalValue
      ),
      installments: state.installments,
      isPaid: state.isPaid,
      paidInstallments: state.paidInstallments,
      paymentDate:
        dto.paymentDate === undefined
          ? existing.paymentDate?.toISOString?.()
          : dto.paymentDate instanceof Date
            ? dto.paymentDate.toISOString()
            : dto.paymentDate,
    })

    const data = PaymentOrderMapper.toPersistence(po)

    db.transaction((tx) => {
      tx.update(paymentOrder)
        .set({
          method: data.method,
          totalValue: data.totalValue,
          installments: data.installments,
          isPaid: data.isPaid,
          paidInstallments: data.paidInstallments,
          // it was not stored before: the date edited on screen was lost
          paymentDate: data.paymentDate,
        })
        .where(eq(paymentOrder.id, dto.id as UUID))
        .run()

      if (data.isPaid) {
        PaymentService.finalizePayment(tx, dto.id as UUID)
      }
    })
  }

  async deletePaymentOrder(id: UUID): Promise<void> {
    db.transaction((tx) => {
      // Remove reference in work orders
      tx.update(workOrder)
        .set({ paymentOrderId: null })
        .where(eq(workOrder.paymentOrderId, id))
        .run()

      // Delete the payment order
      tx.delete(paymentOrder).where(eq(paymentOrder.id, id)).run()
    })
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
