import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { ItineraryWorkOrderRepository } from '@/src/domain/repositories/itinerary-work-order/itinerary-work-order.repository'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import {
  customer,
  itineraryWorkOrder,
  paymentOrder,
  workOrder,
  workOrderResult,
} from '@/src/infra/db/drizzle/schema'
import DrizzleWorkOrderRepository from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'
import { hydrateWorkOrders } from '@/src/infra/repositories/drizzle/work-order-hydration'
import { UUID } from '@/src/lib/utils'
import { eq } from 'drizzle-orm'

export class DrizzleItineraryWorkOrderRepository implements ItineraryWorkOrderRepository {
  constructor(
    private workOrderRepository: DrizzleWorkOrderRepository = new DrizzleWorkOrderRepository()
  ) {}
  async getItineraryWorkOrdersByItineraryId(
    itineraryId: UUID
  ): Promise<ItineraryWorkOrder[]> {
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
      .where(eq(itineraryWorkOrder.itineraryId, itineraryId))
      .orderBy(itineraryWorkOrder.position)

    // Batch hydration (before: getWorkOrder per row, 4 queries per work order)
    const workOrders = await hydrateWorkOrders(rows)
    const byId = new Map(workOrders.map((wo) => [wo.id as string, wo]))

    return rows.flatMap((row) => {
      const wo = byId.get(row.workOrder.id)
      if (!wo) return []
      return [
        ItineraryWorkOrder.fromDTO({
          id: row.itineraryWorkOrder.id as UUID,
          itineraryId: row.itineraryWorkOrder.itineraryId as UUID,
          workOrder: wo.toDTO(),
          position: row.itineraryWorkOrder.position,
          isLate: row.itineraryWorkOrder.isLate,
        }),
      ]
    })
  }
  async getItineraryWorkOrder(id: UUID): Promise<ItineraryWorkOrder> {
    const row = db
      .select()
      .from(itineraryWorkOrder)
      .where(eq(itineraryWorkOrder.id, id))
      .leftJoin(workOrder, eq(itineraryWorkOrder.workOrderId, workOrder.id))
      .limit(1)
      .get()

    if (!row) {
      throw new Error(`Itinerário não encontrado.`)
    }

    const wo = await this.workOrderRepository.getWorkOrder(
      row.itinerary_work_order.workOrderId as UUID
    )

    if (!wo) {
      throw new Error(`Ordem de serviço não foi encontrada.`)
    }

    return ItineraryWorkOrder.fromDTO({
      id: row.itinerary_work_order.id as UUID,
      itineraryId: row.itinerary_work_order.itineraryId as UUID,
      workOrder: wo.toDTO(),
      position: row.itinerary_work_order.position,
      isLate: row.itinerary_work_order.isLate,
    })
  }

  async addItineraryWorkOrder(item: ItineraryWorkOrder): Promise<void> {
    // Validation: Work orders with a result (finished) must NOT be added to the itinerary
    if (item.workOrder.result) {
      throw new Error(
        'Não é possível adicionar uma ordem de serviço já finalizada ao itinerário.'
      )
    }

    await db
      .insert(itineraryWorkOrder)
      .values({
        id: item.id,
        itineraryId: item.itineraryId,
        workOrderId: item.workOrder.id,
        position: item.position,
        isLate: item.isLate,
      })
      .onConflictDoNothing()
  }

  async addItineraryWorkOrders(items: ItineraryWorkOrder[]): Promise<void> {
    if (items.length === 0) return

    // Validation: Filter out work orders that already have a result (finished)
    const validItems = items.filter((item) => !item.workOrder.result)

    if (validItems.length === 0) {
      console.warn(
        'Todas as work orders fornecidas já estão finalizadas e não podem ser adicionadas ao itinerário.'
      )
      return
    }

    if (validItems.length < items.length) {
      console.warn(
        `${items.length - validItems.length} work order(s) finalizada(s) foram ignoradas ao adicionar ao itinerário.`
      )
    }

    const data = validItems.map((item) => ({
      id: item.id,
      itineraryId: item.itineraryId,
      workOrderId: item.workOrder.id,
      position: item.position,
      isLate: item.isLate,
    }))

    await db.insert(itineraryWorkOrder).values(data).onConflictDoNothing()
  }

  async updateItineraryWorkOrder(item: ItineraryWorkOrder): Promise<void> {
    await db
      .update(itineraryWorkOrder)
      .set({
        workOrderId: item.workOrder.id,
        position: item.position,
        isLate: item.isLate,
      })
      .where(eq(itineraryWorkOrder.id, item.id))
  }

  async clearIsLateByWorkOrderId(workOrderId: UUID): Promise<void> {
    await db
      .update(itineraryWorkOrder)
      .set({ isLate: false })
      .where(eq(itineraryWorkOrder.workOrderId, workOrderId))
  }

  async deleteItineraryWorkOrder(id: UUID): Promise<void> {
    await db.delete(itineraryWorkOrder).where(eq(itineraryWorkOrder.id, id))
  }

  async updatePositions(
    items: { id: UUID; position: number }[]
  ): Promise<void> {
    // A single transaction: before, each UPDATE was a separate commit (fsync),
    // and a failure midway left duplicate positions.
    db.transaction((tx) => {
      for (const item of items) {
        tx.update(itineraryWorkOrder)
          .set({ position: item.position })
          .where(eq(itineraryWorkOrder.id, item.id))
          .run()
      }
    })
  }
}
