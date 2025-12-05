import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { ItineraryWorkOrderRepository } from '@/src/domain/repositories/itinerary-work-order/itinerary-work-order.repository'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { itineraryWorkOrder, workOrder } from '@/src/infra/db/drizzle/schema'
import DrizzleWorkOrderRepository from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'
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
      .select()
      .from(itineraryWorkOrder)
      .where(eq(itineraryWorkOrder.itineraryId, itineraryId))
      .leftJoin(workOrder, eq(itineraryWorkOrder.workOrderId, workOrder.id))
      .orderBy(itineraryWorkOrder.position)

    if (rows.length === 0) {
      return []
    }

    const itineraryWorkOrders = await Promise.all(
      rows.map(async (row) => {
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
      })
    )

    return itineraryWorkOrders
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

    const data = items.map((item) => ({
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
    for (const item of items) {
      await db
        .update(itineraryWorkOrder)
        .set({ position: item.position })
        .where(eq(itineraryWorkOrder.id, item.id))
    }
  }
}
