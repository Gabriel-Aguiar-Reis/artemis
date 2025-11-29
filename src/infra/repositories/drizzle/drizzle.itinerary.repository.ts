import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { Itinerary } from '@/src/domain/entities/itinerary/itinerary.entity'
import { ItineraryMapper } from '@/src/domain/entities/itinerary/mapper/itinerary.mapper'
import { PaymentOrderMapper } from '@/src/domain/entities/payment-order/mapper/payment-order.mapper'
import { ProductMapper } from '@/src/domain/entities/product/mapper/product.mapper'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import {
  WorkOrderResultItem,
  WorkOrderResultItemType,
} from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderResultMapper } from '@/src/domain/entities/work-order-result/mapper/work-order-result.mapper'
import { WorkOrderMapper } from '@/src/domain/entities/work-order/mapper/work-order.mapper'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
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
import { product } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import { workOrderItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-item.schema'
import { workOrderResultItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result-item.schema'
import { workOrderResult } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { UUID } from '@/src/lib/utils'
import { and, eq, gte, inArray, lte } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzleItineraryRepository implements ItineraryRepository {
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
        const snapshot = new ProductSnapshot(prod.id, prod.name, prod.salePrice)

        return WorkOrderItem.fromProductSnapshot(
          snapshot,
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
        item: workOrderResultItem,
        product: product,
      })
      .from(workOrderResultItem)
      .leftJoin(product, eq(workOrderResultItem.productId, product.id))
      .where(eq(workOrderResultItem.resultId, resultId))

    const exchangedProducts: WorkOrderResultItem[] = []
    const addedProducts: WorkOrderResultItem[] = []
    const removedProducts: WorkOrderResultItem[] = []

    items
      .filter((row) => row.product)
      .forEach((row) => {
        const prod = ProductMapper.toDomain(row.product!)
        const snapshot = new ProductSnapshot(prod.id, prod.name, prod.salePrice)
        const resultItem = WorkOrderResultItem.fromProductSnapshot(
          row.item.id as UUID,
          snapshot,
          row.item.resultId as UUID,
          row.item.quantity,
          row.item.type,
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
  ): Promise<ItineraryWorkOrder[]> {
    const rows = await db
      .select({
        itineraryWorkOrder: itineraryWorkOrder,
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
        workOrderResult: workOrderResult,
      })
      .from(itineraryWorkOrder)
      .leftJoin(workOrder, eq(itineraryWorkOrder.workOrderId, workOrder.id))
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .leftJoin(workOrderResult, eq(workOrder.resultId, workOrderResult.id))
      .where(eq(itineraryWorkOrder.itineraryId, itineraryId))
      .orderBy(itineraryWorkOrder.position)

    const workOrderMapItems = await Promise.all(
      rows
        .filter((row) => row.workOrder && row.customer)
        .map(async (row) => {
          const cust = CustomerMapper.toDomain(row.customer!)
          const po = row.paymentOrder
            ? PaymentOrderMapper.toDomain(row.paymentOrder!)
            : undefined

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
            items,
            po,
            result
          )

          return new ItineraryWorkOrder(
            row.itineraryWorkOrder.id as UUID,
            row.itineraryWorkOrder.itineraryId as UUID,
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

  async addItinerary(dto: ItineraryInsertDTO): Promise<void> {
    const id = uuid.v4() as UUID
    await db.insert(itinerary).values({ ...dto, id })
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

    if (!row) throw new Error('O itinerário ativo não foi encontrado.')

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
    if (!itin) throw new Error('O itinerário não foi encontrado.')

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
        .delete(itineraryWorkOrder)
        .where(eq(itineraryWorkOrder.itineraryId, id))

      for (const item of itin.workOrders) {
        await tx.insert(itineraryWorkOrder).values({
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
        .filter((row) => row.customer)
        .map(async (row) => {
          const cust = CustomerMapper.toDomain(row.customer!)
          const po = row.paymentOrder
            ? PaymentOrderMapper.toDomain(row.paymentOrder!)
            : undefined

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
            items,
            po,
            result
          )
        })
    )

    return workOrders
  }
}
