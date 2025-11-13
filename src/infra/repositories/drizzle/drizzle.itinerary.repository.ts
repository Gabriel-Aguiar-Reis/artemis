import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { Itinerary } from '@/src/domain/entities/itinerary/itinerary.entity'
import { ItineraryMapper } from '@/src/domain/entities/itinerary/mapper/itinerary.mapper'
import { PaymentOrderMapper } from '@/src/domain/entities/payment-order/mapper/payment-order.mapper'
import { ProductMapper } from '@/src/domain/entities/product/mapper/product.mapper'
import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import { WorkOrderMapItem } from '@/src/domain/entities/work-order-map-item/work-order-map-item.entity'
import { WorkOrderResultItem } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderResultMapper } from '@/src/domain/entities/work-order-result/mapper/work-order-result.mapper'
import { WorkOrderMapper } from '@/src/domain/entities/work-order/mapper/work-order.mapper'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { AddItineraryDto } from '@/src/domain/repositories/itinerary/dtos/add-itinerary.dto'
import { UpdateItineraryDto } from '@/src/domain/repositories/itinerary/dtos/update-itinerary.dto'
import { ItineraryRepository } from '@/src/domain/repositories/itinerary/itinerary.repository'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { itineraryWorkOrders } from '@/src/infra/db/drizzle/schema/drizzle.itinerary-work-orders.schema'
import { itinerary } from '@/src/infra/db/drizzle/schema/drizzle.itinerary.schema'
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
import { and, eq, gte, inArray, lte } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzleItineraryRepository implements ItineraryRepository {
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
        return WorkOrderItem.fromProduct(
          prod,
          row.item.quantity,
          row.item.priceSnapshot
        )
      })
  }

  private async loadWorkOrderResultItems(resultId: UUID): Promise<{
    exchangedProducts: WorkOrderResultItem[]
    addedProducts?: WorkOrderResultItem[]
    removedProducts?: WorkOrderResultItem[]
  }> {
    const items = await db
      .select({
        item: workOrderResultItems,
        product: product,
      })
      .from(workOrderResultItems)
      .leftJoin(product, eq(workOrderResultItems.productId, product.id))
      .where(eq(workOrderResultItems.resultId, resultId))

    const exchangedProducts: WorkOrderResultItem[] = []
    const addedProducts: WorkOrderResultItem[] = []
    const removedProducts: WorkOrderResultItem[] = []

    items
      .filter((row) => row.product)
      .forEach((row) => {
        const prod = ProductMapper.toDomain(row.product!)
        const resultItem = WorkOrderResultItem.fromProduct(
          prod,
          row.item.quantity,
          row.item.priceSnapshot,
          row.item.observation ?? undefined
        )

        switch (row.item.type) {
          case WorkOrderResultItemType.EXCHANGED:
            exchangedProducts.push(resultItem)
            break
          case WorkOrderResultItemType.ADDED:
            addedProducts.push(resultItem)
            break
          case WorkOrderResultItemType.REMOVED:
            removedProducts.push(resultItem)
            break
        }
      })

    return {
      exchangedProducts,
      addedProducts: addedProducts.length > 0 ? addedProducts : undefined,
      removedProducts: removedProducts.length > 0 ? removedProducts : undefined,
    }
  }

  private async loadItineraryWorkOrders(
    itineraryId: UUID
  ): Promise<WorkOrderMapItem[]> {
    const rows = await db
      .select({
        itineraryWorkOrder: itineraryWorkOrders,
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
        workOrderResult: workOrderResult,
      })
      .from(itineraryWorkOrders)
      .leftJoin(workOrder, eq(itineraryWorkOrders.workOrderId, workOrder.id))
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .leftJoin(workOrderResult, eq(workOrder.resultId, workOrderResult.id))
      .where(eq(itineraryWorkOrders.itineraryId, itineraryId))
      .orderBy(itineraryWorkOrders.position)

    const workOrderMapItems = await Promise.all(
      rows
        .filter((row) => row.workOrder && row.customer && row.paymentOrder)
        .map(async (row) => {
          const cust = CustomerMapper.toDomain(row.customer!)
          const po = PaymentOrderMapper.toDomain(row.paymentOrder!)

          let result = undefined
          if (row.workOrderResult) {
            const resultItems = await this.loadWorkOrderResultItems(
              row.workOrderResult.id as UUID
            )
            result = WorkOrderResultMapper.toDomain(
              row.workOrderResult,
              resultItems.exchangedProducts,
              resultItems.addedProducts,
              resultItems.removedProducts
            )
          }

          const items = await this.loadWorkOrderItems(row.workOrder!.id as UUID)

          const wo = WorkOrderMapper.toDomain(
            row.workOrder!,
            cust,
            po,
            items,
            result
          )

          return new WorkOrderMapItem(
            row.itineraryWorkOrder.position,
            wo,
            row.itineraryWorkOrder.isLate
          )
        })
    )

    return workOrderMapItems
  }

  async getItineraries(): Promise<Itinerary[]> {
    const rows = await db.select().from(itinerary)
    if (rows.length === 0) {
      return []
    }

    const itineraries = await Promise.all(
      rows.map(async (row) => {
        const workOrdersMap = await this.loadItineraryWorkOrders(row.id as UUID)
        return ItineraryMapper.toDomain(row, workOrdersMap)
      })
    )

    return itineraries
  }

  async addItinerary(dto: AddItineraryDto): Promise<void> {
    const id = uuid.v4() as UUID

    // Buscar work orders
    const workOrders = await this.getWorkOrdersByIds(dto.workOrderIds)

    // Criar WorkOrderMapItems
    const workOrdersMap = workOrders.map(
      (wo, index) => new WorkOrderMapItem(index + 1, wo, false)
    )

    const itin = new Itinerary(
      id,
      workOrdersMap,
      new Date(dto.initialItineraryDate),
      new Date(dto.finalItineraryDate),
      false
    )

    const data = ItineraryMapper.toPersistence(itin)

    await db.transaction(async (tx) => {
      // Inserir itinerary
      await tx.insert(itinerary).values(data).onConflictDoNothing()

      // Inserir work orders na tabela intermediária
      for (const item of workOrdersMap) {
        await tx.insert(itineraryWorkOrders).values({
          id: uuid.v4() as string,
          itineraryId: id,
          workOrderId: item.workOrder.id,
          position: item.position,
          isLate: item.isLate,
        })
      }
    })
  }

  async updateItinerary(dto: UpdateItineraryDto): Promise<void> {
    const workOrdersMap = dto.workOrdersMap.map((item) =>
      WorkOrderMapItem.fromDTO(item)
    )

    const itin = new Itinerary(
      dto.id as UUID,
      workOrdersMap,
      new Date(dto.initialItineraryDate),
      new Date(dto.finalItineraryDate),
      dto.isFinished
    )

    const data = ItineraryMapper.toPersistence(itin)

    await db.transaction(async (tx) => {
      // Atualizar itinerary
      await tx
        .update(itinerary)
        .set({
          initialItineraryDate: data.initialItineraryDate,
          finalItineraryDate: data.finalItineraryDate,
          isFinished: data.isFinished,
        })
        .where(eq(itinerary.id, dto.id))

      // Deletar work orders antigas
      await tx
        .delete(itineraryWorkOrders)
        .where(eq(itineraryWorkOrders.itineraryId, dto.id))

      // Inserir work orders novas
      for (const item of workOrdersMap) {
        await tx.insert(itineraryWorkOrders).values({
          id: uuid.v4() as string,
          itineraryId: dto.id as UUID,
          workOrderId: item.workOrder.id,
          position: item.position,
          isLate: item.isLate,
        })
      }
    })
  }

  async deleteItinerary(id: UUID): Promise<void> {
    await db.transaction(async (tx) => {
      // Deletar work orders (cascade)
      await tx
        .delete(itineraryWorkOrders)
        .where(eq(itineraryWorkOrders.itineraryId, id))

      // Deletar itinerary
      await tx.delete(itinerary).where(eq(itinerary.id, id))
    })
  }

  async getItinerary(id: UUID): Promise<Itinerary | null> {
    const [row] = await db.select().from(itinerary).where(eq(itinerary.id, id))
    if (!row) return null

    const workOrdersMap = await this.loadItineraryWorkOrders(id)
    return ItineraryMapper.toDomain(row, workOrdersMap)
  }

  async getActiveItinerary(): Promise<Itinerary | null> {
    const [row] = await db
      .select()
      .from(itinerary)
      .where(eq(itinerary.isFinished, false))
      .limit(1)

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

    const itineraries = await Promise.all(
      rows.map(async (row) => {
        const workOrdersMap = await this.loadItineraryWorkOrders(row.id as UUID)
        return ItineraryMapper.toDomain(row, workOrdersMap)
      })
    )

    return itineraries
  }

  async finishItinerary(id: UUID): Promise<void> {
    const itin = await this.getItinerary(id)
    if (!itin) throw new Error('Itinerary not found')

    itin.finish()

    const data = ItineraryMapper.toPersistence(itin)

    await db.transaction(async (tx) => {
      // Atualizar itinerary
      await tx
        .update(itinerary)
        .set({
          isFinished: data.isFinished,
        })
        .where(eq(itinerary.id, id))

      // Atualizar work orders (isLate)
      await tx
        .delete(itineraryWorkOrders)
        .where(eq(itineraryWorkOrders.itineraryId, id))

      for (const item of itin.workOrdersMap) {
        await tx.insert(itineraryWorkOrders).values({
          id: uuid.v4() as string,
          itineraryId: id,
          workOrderId: item.workOrder.id,
          position: item.position,
          isLate: item.isLate,
        })
      }
    })
  }

  // Helper privado para buscar work orders
  private async getWorkOrdersByIds(ids: UUID[]): Promise<WorkOrder[]> {
    const rows = await db
      .select({
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
        workOrderResult: workOrderResult,
      })
      .from(workOrder)
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .leftJoin(workOrderResult, eq(workOrder.resultId, workOrderResult.id))
      .where(inArray(workOrder.id, ids))

    const workOrders = await Promise.all(
      rows
        .filter((row) => row.customer && row.paymentOrder)
        .map(async (row) => {
          const cust = CustomerMapper.toDomain(row.customer!)
          const po = PaymentOrderMapper.toDomain(row.paymentOrder!)

          let result = undefined
          if (row.workOrderResult) {
            const resultItems = await this.loadWorkOrderResultItems(
              row.workOrderResult.id as UUID
            )
            result = WorkOrderResultMapper.toDomain(
              row.workOrderResult,
              resultItems.exchangedProducts,
              resultItems.addedProducts,
              resultItems.removedProducts
            )
          }

          const items = await this.loadWorkOrderItems(row.workOrder.id as UUID)
          return WorkOrderMapper.toDomain(
            row.workOrder,
            cust,
            po,
            items,
            result
          )
        })
    )

    return workOrders
  }
}
