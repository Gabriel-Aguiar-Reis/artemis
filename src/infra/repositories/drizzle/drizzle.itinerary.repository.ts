import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { Itinerary } from '@/src/domain/entities/itinerary/itinerary.entity'
import { ItineraryMapper } from '@/src/domain/entities/itinerary/mapper/itinerary.mapper'
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import { ItineraryRepository } from '@/src/domain/repositories/itinerary/itinerary.repository'
import {
  ItineraryInsertDTO,
  ItineraryUpdateDTO,
} from '@/src/domain/validations/itinerary.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { itineraryWorkOrder } from '@/src/infra/db/drizzle/schema/drizzle.itinerary-work-order.schema'
import { itinerary } from '@/src/infra/db/drizzle/schema/drizzle.itinerary.schema'
import { paymentOrder } from '@/src/infra/db/drizzle/schema/drizzle.payment-order.schema'
import { workOrderResult } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { hydrateWorkOrders } from '@/src/infra/repositories/drizzle/work-order-hydration'
import { UUID } from '@/src/lib/utils'
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export type ItinerarySummary = {
  id: UUID
  initialItineraryDate: Date
  finalItineraryDate: Date
  totalWorkOrders: number
  lateWorkOrders: number
  ordersWithResult: number
  totalRevenue: number
}

// Só OS em aberto entram num itinerário novo.
const OPEN_STATUSES = [
  WorkOrderStatus.PENDING,
  WorkOrderStatus.COMMITTED,
  WorkOrderStatus.IN_PROGRESS,
]

export default class DrizzleItineraryRepository implements ItineraryRepository {
  /**
   * Carrega os vínculos itinerário↔OS de um ou mais itinerários com as OS já
   * hidratadas em lote (sem consultas por OS).
   */
  private async loadItineraryWorkOrdersFor(
    itineraryIds: string[]
  ): Promise<Map<string, ItineraryWorkOrder[]>> {
    const map = new Map<string, ItineraryWorkOrder[]>()
    if (itineraryIds.length === 0) return map

    const rows = await db
      .select({
        itineraryWorkOrder: itineraryWorkOrder,
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
        result: workOrderResult,
      })
      .from(itineraryWorkOrder)
      .innerJoin(workOrder, eq(itineraryWorkOrder.workOrderId, workOrder.id))
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .leftJoin(workOrderResult, eq(workOrder.resultId, workOrderResult.id))
      .where(inArray(itineraryWorkOrder.itineraryId, itineraryIds))
      .orderBy(itineraryWorkOrder.itineraryId, asc(itineraryWorkOrder.position))

    const workOrders = await hydrateWorkOrders(rows)
    const byId = new Map(workOrders.map((wo) => [wo.id as string, wo]))

    for (const row of rows) {
      const wo = byId.get(row.workOrder.id)
      if (!wo) continue
      const iwo = new ItineraryWorkOrder(
        row.itineraryWorkOrder.id as UUID,
        row.itineraryWorkOrder.itineraryId as UUID,
        row.itineraryWorkOrder.position,
        wo,
        row.itineraryWorkOrder.isLate
      )
      const list = map.get(row.itineraryWorkOrder.itineraryId)
      if (list) list.push(iwo)
      else map.set(row.itineraryWorkOrder.itineraryId, [iwo])
    }
    return map
  }

  private async loadItineraryWorkOrders(
    itineraryId: UUID
  ): Promise<ItineraryWorkOrder[]> {
    const map = await this.loadItineraryWorkOrdersFor([itineraryId])
    return map.get(itineraryId) ?? []
  }

  async getItineraries(): Promise<Itinerary[]> {
    const rows = await db.select().from(itinerary)
    if (rows.length === 0) {
      return []
    }

    const iwoMap = await this.loadItineraryWorkOrdersFor(rows.map((r) => r.id))
    return rows.map((row) =>
      ItineraryMapper.toDomain(row, iwoMap.get(row.id) ?? [])
    )
  }

  async addItinerary(dto: ItineraryInsertDTO): Promise<void> {
    const id = uuid.v4() as UUID

    // Verificar se já existe um itinerário ativo
    const activeItinerary = db
      .select()
      .from(itinerary)
      .where(eq(itinerary.isFinished, false))
      .limit(1)
      .get()

    if (activeItinerary) {
      throw new Error(
        'Já existe um itinerário ativo. Finalize-o antes de criar um novo.'
      )
    }

    // Buscar work orders no período
    // Mesma janela da prévia (getWorkOrdersByDateRange): do início do primeiro
    // dia ao fim do último dia, no fuso do aparelho. Antes o fim ficava em
    // 00:00 do último dia e as OS daquele dia não entravam no itinerário.
    const startDate = new Date(dto.initialItineraryDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(dto.finalItineraryDate)
    endDate.setHours(23, 59, 59, 999)

    const workOrdersInPeriod = await db
      .select()
      .from(workOrder)
      .where(
        and(
          isNull(workOrder.visitDate),
          isNull(workOrder.resultId),
          isNull(workOrder.paymentOrderId),
          inArray(workOrder.status, OPEN_STATUSES),
          gte(workOrder.scheduledDate, startDate.toISOString()),
          lte(workOrder.scheduledDate, endDate.toISOString())
        )
      )
      .orderBy(asc(workOrder.scheduledDate))

    // OS que já ficaram atrasadas em algum itinerário anterior (1 consulta só;
    // antes era 1 por OS e pegava um vínculo "anterior" aleatório, ordenado
    // por UUID).
    const lateBefore = new Set<string>()
    const woIds = workOrdersInPeriod.map((wo) => wo.id)
    for (let i = 0; i < woIds.length; i += 500) {
      const lateRows = await db
        .selectDistinct({ workOrderId: itineraryWorkOrder.workOrderId })
        .from(itineraryWorkOrder)
        .where(
          and(
            inArray(itineraryWorkOrder.workOrderId, woIds.slice(i, i + 500)),
            eq(itineraryWorkOrder.isLate, true)
          )
        )
      lateRows.forEach((r) => lateBefore.add(r.workOrderId))
    }
    const now = new Date()

    db.transaction((tx) => {
      // Criar o itinerário
      tx.insert(itinerary)
        .values({ ...dto, id })
        .run()

      // Criar os itinerary-work-orders
      for (let i = 0; i < workOrdersInPeriod.length; i++) {
        const wo = workOrdersInPeriod[i]

        const isOverdue = new Date(wo.scheduledDate) < now

        tx.insert(itineraryWorkOrder)
          .values({
            id: uuid.v4() as string,
            itineraryId: id,
            workOrderId: wo.id,
            position: i + 1,
            isLate: lateBefore.has(wo.id) || isOverdue,
          })
          .run()
      }
    })
  }

  async updateItinerary(dto: ItineraryUpdateDTO): Promise<void> {
    if (!dto.id) {
      throw new Error('o ID do itinerário é obrigatório para atualização.')
    }

    const row = db
      .select()
      .from(itinerary)
      .where(eq(itinerary.id, dto.id))
      .limit(1)
      .get()

    if (!row) {
      throw new Error('Itinerário não encontrado para atualização.')
    }

    await db
      .update(itinerary)
      .set({
        initialItineraryDate: dto.initialItineraryDate,
        finalItineraryDate: dto.finalItineraryDate,
        isFinished: dto.isFinished,
      })
      .where(eq(itinerary.id, dto.id as string))
  }

  async deleteItinerary(id: UUID): Promise<void> {
    await db.delete(itinerary).where(eq(itinerary.id, id))
  }

  async getItinerary(id: UUID): Promise<Itinerary> {
    const row = db
      .select()
      .from(itinerary)
      .where(eq(itinerary.id, id))
      .limit(1)
      .get()
    if (!row) throw new Error('O itinerário não foi encontrado.')

    const workOrdersMap = await this.loadItineraryWorkOrders(id)
    return ItineraryMapper.toDomain(row, workOrdersMap)
  }

  async getActiveItinerary(): Promise<Itinerary | null> {
    const row = db
      .select()
      .from(itinerary)
      .where(eq(itinerary.isFinished, false))
      .limit(1)
      .get()

    if (!row) return null

    const workOrdersMap = await this.loadItineraryWorkOrders(row.id as UUID)
    return ItineraryMapper.toDomain(row, workOrdersMap)
  }

  async getItinerariesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Itinerary[]> {
    const startStr = startDate.toISOString()
    const endStr = endDate.toISOString()

    const rows = await db
      .select()
      .from(itinerary)
      .where(
        and(
          gte(itinerary.initialItineraryDate, startStr),
          lte(itinerary.finalItineraryDate, endStr)
        )
      )

    const iwoMap = await this.loadItineraryWorkOrdersFor(rows.map((r) => r.id))
    return rows.map((row) =>
      ItineraryMapper.toDomain(row, iwoMap.get(row.id) ?? [])
    )
  }

  async updateFinishItinerary(id: UUID): Promise<void> {
    const itin = await this.getItinerary(id)
    if (!itin) throw new Error('O itinerário não foi encontrado.')

    itin.finish()

    const data = ItineraryMapper.toPersistence(itin)

    db.transaction((tx) => {
      // Atualizar itinerary
      tx.update(itinerary)
        .set({
          isFinished: data.isFinished,
        })
        .where(eq(itinerary.id, id))
        .run()

      // Atualizar status das OS e a marcação de atraso de cada vínculo,
      // preservando os ids dos vínculos (antes eram apagados e recriados).
      const updatedAt = new Date().toISOString()
      for (const item of itin.workOrders) {
        tx.update(workOrder)
          .set({ status: item.workOrder.status, updatedAt })
          .where(eq(workOrder.id, item.workOrder.id))
          .run()
        tx.update(itineraryWorkOrder)
          .set({ isLate: item.isLate })
          .where(eq(itineraryWorkOrder.id, item.id))
          .run()
      }
    })
  }

  /**
   * Resumo dos itinerários finalizados para o histórico, agregado no SQL.
   * Antes o histórico hidratava todos os itinerários com todas as OS (itens,
   * relatórios, pagamentos) só para exibir contagens e soma.
   */
  async getFinishedItinerarySummaries(): Promise<ItinerarySummary[]> {
    const rows = await db
      .select({
        id: itinerary.id,
        initialItineraryDate: itinerary.initialItineraryDate,
        finalItineraryDate: itinerary.finalItineraryDate,
        totalWorkOrders: sql<number>`count(${itineraryWorkOrder.id})`,
        lateWorkOrders: sql<number>`coalesce(sum(case when ${itineraryWorkOrder.isLate} then 1 else 0 end), 0)`,
        ordersWithResult: sql<number>`coalesce(sum(case when ${workOrder.resultId} is not null then 1 else 0 end), 0)`,
        totalRevenue: sql<number>`coalesce(sum(${paymentOrder.totalValue}), 0)`,
      })
      .from(itinerary)
      .leftJoin(
        itineraryWorkOrder,
        eq(itineraryWorkOrder.itineraryId, itinerary.id)
      )
      .leftJoin(workOrder, eq(itineraryWorkOrder.workOrderId, workOrder.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .where(eq(itinerary.isFinished, true))
      .groupBy(itinerary.id)
      .orderBy(desc(itinerary.finalItineraryDate))

    return rows.map((r) => ({
      id: r.id as UUID,
      initialItineraryDate: new Date(r.initialItineraryDate),
      finalItineraryDate: new Date(r.finalItineraryDate),
      totalWorkOrders: Number(r.totalWorkOrders),
      lateWorkOrders: Number(r.lateWorkOrders),
      ordersWithResult: Number(r.ordersWithResult),
      totalRevenue: Math.round(Number(r.totalRevenue) * 100) / 100,
    }))
  }
}
