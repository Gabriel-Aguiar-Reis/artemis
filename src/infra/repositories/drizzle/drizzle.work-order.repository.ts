import {
  AppTransaction,
  PaymentService,
} from '@/src/application/services/payment.service'
import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { PaymentOrderMapper } from '@/src/domain/entities/payment-order/mapper/payment-order.mapper'
import { PaymentOrderSerializableDTO } from '@/src/domain/entities/payment-order/payment-order.entity'
import { WorkOrderItemMapper } from '@/src/domain/entities/work-order-item/mapper/work-order-item.mapper'
import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import { WorkOrderResultItemType } from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderResultMapper } from '@/src/domain/entities/work-order-result/mapper/work-order-result.mapper'
import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { WorkOrderMapper } from '@/src/domain/entities/work-order/mapper/work-order.mapper'
import {
  computeResultTotal,
  isKnownStatus,
  isOpenStatus,
  normalizePaymentState,
  resolveResultStatus,
  RESULT_EDITABLE_STATUSES,
  roundMoney,
} from '@/src/domain/entities/work-order/work-order-rules'
import {
  WorkOrder,
  WorkOrderStatus,
} from '@/src/domain/entities/work-order/work-order.entity'
import {
  PaginatedWorkOrders,
  WorkOrderRepository,
} from '@/src/domain/repositories/work-order/work-order.repository'
import {
  WorkOrderInsertDTO,
  WorkOrderUpdateDTO,
} from '@/src/domain/validations/work-order.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { itineraryWorkOrder } from '@/src/infra/db/drizzle/schema/drizzle.itinerary-work-order.schema'
import { paymentOrder } from '@/src/infra/db/drizzle/schema/drizzle.payment-order.schema'
import { workOrderItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-item.schema'
import { workOrderResultItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result-item.schema'
import { workOrderResult } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'
import { containsFolded } from '@/src/infra/db/drizzle/sql-search'
import { hydrateWorkOrders } from '@/src/infra/repositories/drizzle/work-order-hydration'
import { UUID } from '@/src/lib/utils'
import {
  and,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  like,
  lte,
  ne,
  or,
} from 'drizzle-orm'
import uuid from 'react-native-uuid'

export interface WorkOrderFilters {
  search?: string
  phoneNumber?: string
  landlineNumber?: string
  isWhatsApp?: string
  scheduledDate?: string
  visitDate?: string
  minTotalValue?: string
  maxTotalValue?: string
  isPaid?: string
  hasPayment?: string
  hasResult?: string
  isExpired?: string
  isCopied?: string
}

export type WorkOrderItemInput = {
  productId: string
  quantity: number
  priceSnapshot: number
  observation?: string | null
}

export type ResultInput = {
  exchanged: WorkOrderItemInput[]
  added: WorkOrderItemInput[]
  removed: WorkOrderItemInput[]
}

export type PaymentInput = {
  method: string
  totalValue: number
  installments: number
  isPaid: boolean
  paymentDate?: string | null
}

export type CreateWorkOrderInput = {
  customerId: string
  scheduledDate: Date
  notes?: string | null
  items: WorkOrderItemInput[]
  result?: ResultInput
  payment?: PaymentInput
}

function assertValidItem(i: WorkOrderItemInput) {
  if (!Number.isInteger(i.quantity) || i.quantity < 1)
    throw new Error(
      'A quantidade de cada produto deve ser um número inteiro maior que zero.'
    )
  if (!Number.isFinite(i.priceSnapshot) || i.priceSnapshot < 0)
    throw new Error(
      'O preço de cada produto deve ser um valor maior ou igual a zero.'
    )
}

export default class DrizzleWorkOrderRepository implements WorkOrderRepository {
  async getWorkOrders(): Promise<WorkOrder[]> {
    const rows = await db
      .select({
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
        result: workOrderResult,
      })
      .from(workOrder)
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .leftJoin(workOrderResult, eq(workOrder.resultId, workOrderResult.id))

    if (rows.length === 0) {
      return []
    }

    const workOrders = await hydrateWorkOrders(rows)

    return workOrders
  }

  async getWorkOrdersPaginated(
    page: number,
    pageSize: number,
    filters?: WorkOrderFilters
  ): Promise<PaginatedWorkOrders> {
    const offset = (page - 1) * pageSize

    // Construir condições de filtro dinamicamente
    const conditions = []

    // Filtro de busca por nome do cliente
    if (filters?.search) {
      conditions.push(
        or(
          containsFolded(customer.storeName, filters.search),
          containsFolded(customer.contactName, filters.search)
        )
      )
    }

    // Filtro por telefone (já vem normalizado sem formatação)
    if (filters?.phoneNumber) {
      const phoneDigits = filters.phoneNumber.replace(/\D+/g, '')
      if (phoneDigits) {
        conditions.push(like(customer.phoneNumber, `%${phoneDigits}%`))
      }
    }

    // Filtro por telefone fixo (já vem normalizado sem formatação)
    if (filters?.landlineNumber) {
      const landlineDigits = filters.landlineNumber.replace(/\D+/g, '')
      if (landlineDigits) {
        conditions.push(like(customer.landlineNumber, `%${landlineDigits}%`))
      }
    }

    // Filtro por WhatsApp
    if (filters?.isWhatsApp && filters.isWhatsApp !== 'all') {
      const isWhatsApp = filters.isWhatsApp === 'true'
      conditions.push(
        or(
          eq(customer.phoneIsWhatsApp, isWhatsApp),
          eq(customer.landlineIsWhatsApp, isWhatsApp)
        )
      )
    }

    // Filtro por data agendada
    if (filters?.scheduledDate) {
      const filterDate = new Date(filters.scheduledDate)
      const startOfDay = new Date(filterDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(filterDate)
      endOfDay.setHours(23, 59, 59, 999)

      conditions.push(
        and(
          gte(workOrder.scheduledDate, startOfDay.toISOString()),
          lte(workOrder.scheduledDate, endOfDay.toISOString())
        )
      )
    }

    // Filtro por data de visita
    if (filters?.visitDate) {
      const filterDate = new Date(filters.visitDate)
      const startOfDay = new Date(filterDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(filterDate)
      endOfDay.setHours(23, 59, 59, 999)

      conditions.push(
        and(
          gte(workOrder.visitDate, startOfDay.toISOString()),
          lte(workOrder.visitDate, endOfDay.toISOString())
        )
      )
    }

    // Filtro por valor mínimo total
    if (filters?.minTotalValue) {
      const minValue = Number(filters.minTotalValue)
      conditions.push(gte(paymentOrder.totalValue, minValue))
    }

    // Filtro por valor máximo total
    if (filters?.maxTotalValue) {
      const maxValue = Number(filters.maxTotalValue)
      conditions.push(lte(paymentOrder.totalValue, maxValue))
    }

    // Filtro por status de pagamento (isPaid)
    if (filters?.isPaid && filters.isPaid !== 'all') {
      const isPaid = filters.isPaid === 'true'
      conditions.push(eq(paymentOrder.isPaid, isPaid))
    }

    // Filtro hasPayment
    if (filters?.hasPayment && filters.hasPayment !== 'all') {
      if (filters.hasPayment === 'true') {
        conditions.push(isNotNull(workOrder.paymentOrderId))
      } else {
        conditions.push(isNull(workOrder.paymentOrderId))
      }
    }

    // Filtro hasResult
    if (filters?.hasResult && filters.hasResult !== 'all') {
      if (filters.hasResult === 'true') {
        conditions.push(isNotNull(workOrder.resultId))
      } else {
        conditions.push(isNull(workOrder.resultId))
      }
    }

    // Filtro isExpired
    if (filters?.isExpired && filters.isExpired !== 'all') {
      if (filters.isExpired === 'true') {
        conditions.push(eq(workOrder.status, WorkOrderStatus.EXPIRED))
      } else {
        conditions.push(ne(workOrder.status, WorkOrderStatus.EXPIRED))
      }
    }

    // Filtro isCopied
    if (filters?.isCopied && filters.isCopied !== 'all') {
      if (filters.isCopied === 'true') {
        conditions.push(eq(workOrder.status, WorkOrderStatus.COPIED))
      } else {
        conditions.push(ne(workOrder.status, WorkOrderStatus.COPIED))
      }
    }

    // Aplicar WHERE com todas as condições
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Busca total de registros e registros da página em paralelo
    const [rows, totalResult] = await Promise.all([
      db
        .select({
          workOrder: workOrder,
          customer: customer,
          paymentOrder: paymentOrder,
          result: workOrderResult,
        })
        .from(workOrder)
        .leftJoin(customer, eq(workOrder.customerId, customer.id))
        .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
        .leftJoin(workOrderResult, eq(workOrder.resultId, workOrderResult.id))
        .where(whereClause)
        // Ordem estável: sem ORDER BY o OFFSET pode repetir/pular OS entre páginas
        .orderBy(desc(workOrder.scheduledDate), desc(workOrder.id))
        .limit(pageSize)
        .offset(offset),
      // Os mesmos joins da consulta principal: os filtros de valor/pago usam
      // colunas de payment_order e quebravam o COUNT sem esse join.
      db
        .select({ count: count() })
        .from(workOrder)
        .leftJoin(customer, eq(workOrder.customerId, customer.id))
        .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
        .where(whereClause),
    ])

    const totalCount = totalResult[0]?.count ?? 0
    const hasMore = offset + rows.length < totalCount

    const workOrders = await hydrateWorkOrders(rows)

    return {
      data: workOrders,
      hasMore,
      totalCount,
    }
  }

  async addWorkOrder(dto: WorkOrderInsertDTO): Promise<UUID> {
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

    db.transaction((tx) => {
      tx.insert(workOrder).values(data).onConflictDoNothing().run()

      // Inserir WorkOrderItems se fornecidos
      const products = (dto as any).products as WorkOrderItem[] | undefined
      if (products && products.length > 0) {
        const itemsData = products.map((item) =>
          WorkOrderItemMapper.toPersistence(item, id)
        )
        tx.insert(workOrderItem).values(itemsData).onConflictDoNothing().run()
      }
    })

    return id
  }

  async updateWorkOrder(dto: WorkOrderUpdateDTO): Promise<void> {
    const wo = await this.getWorkOrder(dto.id as UUID)
    if (!wo) {
      throw new Error('A ordem de serviço não foi encontrada.')
    }

    // OS encerrada não troca de cliente nem de data: isso reescreveria o
    // histórico de visita/pagamento. Observações continuam editáveis.
    const changesCustomer =
      !!dto.customerId && dto.customerId !== wo.customer.id
    const changesDate =
      !!dto.scheduledDate &&
      // compara o dia no fuso do aparelho (o picker pode mudar só o horário)
      new Date(dto.scheduledDate).toDateString() !==
        wo.scheduledDate.toDateString()
    if ((changesCustomer || changesDate) && !isOpenStatus(wo.status)) {
      throw new Error(
        'Esta ordem de serviço já foi encerrada: não é possível alterar cliente ou data.'
      )
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

    // Atualizar notas (string vazia limpa a observação; antes era ignorada)
    if (dto.notes !== undefined) {
      wo.notes = dto.notes ?? undefined
    }

    wo.updatedAt = new Date()

    const data = WorkOrderMapper.toPersistence(wo)

    await db
      .update(workOrder)
      .set({
        customerId: data.customerId,
        scheduledDate: data.scheduledDate,
        visitDate: data.visitDate,
        status: data.status,
        notes: data.notes,
        updatedAt: data.updatedAt,
      })
      .where(eq(workOrder.id, dto.id as UUID))
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

  async updateWorkOrderWithResult(
    id: UUID,
    resultId: UUID,
    status: string,
    visitDate: Date
  ): Promise<void> {
    // Antes aceitava qualquer string ('completed' minúsculo travava o itinerário)
    const normalized = status.toUpperCase()
    if (!isKnownStatus(normalized)) {
      throw new Error(`Status de ordem de serviço inválido: ${status}`)
    }
    status = normalized
    db.transaction((tx) => {
      // Atualizar a work order
      tx.update(workOrder)
        .set({
          resultId,
          status: status as WorkOrderStatus,
          visitDate: visitDate.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(workOrder.id, id))
        .run()

      // Limpar isLate de todas as itinerary_work_orders desta work order
      tx.update(itineraryWorkOrder)
        .set({ isLate: false })
        .where(eq(itineraryWorkOrder.workOrderId, id))
        .run()
    })
  }

  async updateWorkOrderWithPayment(
    id: UUID,
    paymentOrderId: UUID
  ): Promise<void> {
    db.transaction((tx) => {
      // Vincular paymentOrder à workOrder
      tx.update(workOrder)
        .set({
          paymentOrderId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(workOrder.id, id))
        .run()

      // Verificar se a ordem de pagamento está paga
      const po = tx
        .select()
        .from(paymentOrder)
        .where(eq(paymentOrder.id, paymentOrderId))
        .limit(1)
        .all()

      if (po.length > 0 && po[0].isPaid) {
        // Se já está paga, finalizar a work order
        PaymentService.finalizePayment(tx, paymentOrderId)
      }
    })
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

    db.transaction((tx) => {
      // Salvar resultado primeiro
      tx.insert(workOrderResult)
        .values(WorkOrderResultMapper.toPersistence(result))
        .onConflictDoNothing()
        .run()

      // Salvar items do resultado
      if (result.exchangedProducts) {
        for (const item of result.exchangedProducts) {
          tx.insert(workOrderResultItem)
            .values({
              id: uuid.v4() as string,
              resultId: result.id,
              productId: item.productId,
              quantity: item.quantity,
              priceSnapshot: item.salePrice,
              type: WorkOrderResultItemType.EXCHANGED,
              observation: item.observation ?? null,
            })
            .run()
        }
      }

      if (result.addedProducts) {
        for (const item of result.addedProducts) {
          tx.insert(workOrderResultItem)
            .values({
              id: uuid.v4() as string,
              resultId: result.id,
              productId: item.productId,
              quantity: item.quantity,
              priceSnapshot: item.salePrice,
              type: WorkOrderResultItemType.ADDED,
              observation: item.observation ?? null,
            })
            .run()
        }
      }

      if (result.removedProducts) {
        for (const item of result.removedProducts) {
          tx.insert(workOrderResultItem)
            .values({
              id: uuid.v4() as string,
              resultId: result.id,
              productId: item.productId,
              quantity: item.quantity,
              priceSnapshot: item.salePrice,
              type: WorkOrderResultItemType.REMOVED,
              observation: item.observation ?? null,
            })
            .run()
        }
      }

      // Criar ou atualizar payment order, se aplicável
      if (wo.paymentOrder) {
        const poData = PaymentOrderMapper.toPersistence(wo.paymentOrder)
        tx.update(paymentOrder)
          .set(poData)
          .where(eq(paymentOrder.id, wo.paymentOrder.id))
          .run()
      } else if (result.totalValue > 0) {
        const newPoId = uuid.v4() as string
        tx.insert(paymentOrder)
          .values({
            id: newPoId,
            method: 'Dinheiro',
            totalValue: result.totalValue,
            installments: 1,
            isPaid: false,
            paidInstallments: 0,
          })
          .run()
        // set payment_order_id on work order persistence object
        woData.paymentOrderId = newPoId
      }

      // Atualizar work order
      tx.update(workOrder)
        .set({
          status: woData.status,
          resultId: result.id,
          paymentOrderId: woData.paymentOrderId,
          updatedAt: woData.updatedAt,
        })
        .where(eq(workOrder.id, id))
        .run()
    })
  }

  async deleteWorkOrder(id: UUID): Promise<void> {
    const [woRow] = await db
      .select()
      .from(workOrder)
      .where(eq(workOrder.id, id))

    if (woRow) {
      db.transaction((tx) => {
        // Deletar relacionamento com itinerários
        tx.delete(itineraryWorkOrder)
          .where(eq(itineraryWorkOrder.workOrderId, id))
          .run()

        // Deletar items da work order
        tx.delete(workOrderItem).where(eq(workOrderItem.workOrderId, id)).run()

        // Deletar result items se existir result
        if (woRow.resultId) {
          tx.delete(workOrderResultItem)
            .where(eq(workOrderResultItem.resultId, woRow.resultId))
            .run()

          // Deletar result
          tx.delete(workOrderResult)
            .where(eq(workOrderResult.id, woRow.resultId))
            .run()
        }

        // Deletar payment order se existir
        if (woRow.paymentOrderId) {
          tx.delete(paymentOrder)
            .where(eq(paymentOrder.id, woRow.paymentOrderId))
            .run()
        }

        // Finalmente, deletar work order
        tx.delete(workOrder).where(eq(workOrder.id, id)).run()
      })
    }
  }

  async getWorkOrder(id: UUID): Promise<WorkOrder | null> {
    const row = db
      .select({
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
        result: workOrderResult,
      })
      .from(workOrder)
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .leftJoin(workOrderResult, eq(workOrder.resultId, workOrderResult.id))
      .where(eq(workOrder.id, id))
      .limit(1)
      .get()

    if (!row || !row.customer) {
      return null
    }

    const [wo] = await hydrateWorkOrders([row])
    return wo ?? null
  }

  async getWorkOrdersByCustomer(customerId: UUID): Promise<WorkOrder[]> {
    const rows = await db
      .select({
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
        result: workOrderResult,
      })
      .from(workOrder)
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .leftJoin(workOrderResult, eq(workOrder.resultId, workOrderResult.id))
      .where(eq(workOrder.customerId, customerId))

    if (rows.length === 0) {
      return []
    }

    const workOrders = await hydrateWorkOrders(rows)

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

    const workOrders = await hydrateWorkOrders(rows)

    return workOrders
  }

  async getWorkOrdersByDate(date: Date): Promise<WorkOrder[]> {
    // Normalizar data para início e fim do dia
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const startStr = startOfDay.toISOString()
    const endStr = endOfDay.toISOString()

    const rows = await db
      .select({
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
      })
      .from(workOrder)
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .where(
        and(
          gte(workOrder.scheduledDate, startStr),
          lte(workOrder.scheduledDate, endStr)
        )
      )

    const workOrders = await hydrateWorkOrders(rows)

    return workOrders
  }

  async addCreateFromFinished(
    originalId: UUID,
    newScheduledDate: Date,
    newPaymentOrder?: PaymentOrderSerializableDTO
  ): Promise<UUID> {
    const original = await this.getWorkOrder(originalId)
    if (!original) throw new Error('Ordem de serviço original não encontrada.')

    if (
      original.status !== WorkOrderStatus.COMPLETED &&
      original.status !== WorkOrderStatus.PARTIAL &&
      original.status !== WorkOrderStatus.EXPIRED
    ) {
      throw new Error(
        'Só é possível criar nova OS a partir de uma OS finalizada, parcial ou expirada.'
      )
    }

    // Marcar a ordem original como COPIED (EXPIRED, COMPLETED ou PARTIAL)
    const shouldMarkAsCopied =
      original.status === WorkOrderStatus.EXPIRED ||
      original.status === WorkOrderStatus.COMPLETED ||
      original.status === WorkOrderStatus.PARTIAL

    // Criar payment order se fornecido
    let createdId: UUID | null = null
    db.transaction((tx) => {
      let paymentOrderId: UUID | null = null
      if (newPaymentOrder) {
        paymentOrderId = String(uuid.v4()) as UUID
        try {
          tx.insert(paymentOrder)
            .values({
              id: paymentOrderId,
              method: newPaymentOrder.method,
              totalValue: newPaymentOrder.totalValue,
              installments: newPaymentOrder.installments ?? 1,
              isPaid: false,
              paidInstallments: 0,
            })
            .onConflictDoNothing()
            .run()
        } catch {
          throw new Error('Falha ao criar a ordem de pagamento.')
        }
      }

      const newWo = original.createFromResult(newScheduledDate, newPaymentOrder)

      const newWoData = WorkOrderMapper.toPersistence(newWo)
      // createFromResult gera outro id para o pagamento; a OS precisa apontar
      // para o que foi realmente inserido acima (antes ficava FK quebrada).
      newWoData.paymentOrderId = paymentOrderId

      try {
        tx.insert(workOrder).values(newWoData).onConflictDoNothing().run()
        createdId = newWo.id
      } catch {
        throw new Error('Falha ao criar a nova ordem de serviço.')
      }

      // inserir items (antes um `return` aqui pulava a marcação COPIED
      // da OS original quando não havia produtos)
      for (const item of newWo.products ?? []) {
        try {
          tx.insert(workOrderItem)
            .values({
              id: String(uuid.v4()),
              workOrderId: newWo.id,
              productId: item.productId,
              quantity: item.quantity,
              priceSnapshot: item.priceSnapshot,
            })
            .run()
        } catch {
          throw new Error('Falha ao criar os itens da nova ordem de serviço.')
        }
      }

      // Marcar a ordem original como COPIED
      if (shouldMarkAsCopied) {
        tx.update(workOrder)
          .set({ status: WorkOrderStatus.COPIED })
          .where(eq(workOrder.id, originalId))
          .run()
      }
    })

    if (!createdId)
      throw new Error('Falha ao obter ID da nova ordem de serviço.')
    return createdId
  }

  async getWorkOrdersByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<WorkOrder[]> {
    // Normalizar datas para início e fim do dia
    const startDateNormalized = new Date(startDate)
    startDateNormalized.setHours(0, 0, 0, 0)
    const endDateNormalized = new Date(endDate)
    endDateNormalized.setHours(23, 59, 59, 999)

    const startDateStr = startDateNormalized.toISOString()
    const endDateStr = endDateNormalized.toISOString()

    const rows = await db
      .select({
        workOrder: workOrder,
        customer: customer,
        paymentOrder: paymentOrder,
        result: workOrderResult,
      })
      .from(workOrder)
      .leftJoin(customer, eq(workOrder.customerId, customer.id))
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .leftJoin(workOrderResult, eq(workOrder.resultId, workOrderResult.id))
      .where(
        and(
          isNull(workOrder.visitDate),
          isNull(workOrder.resultId),
          isNull(workOrder.paymentOrderId),
          ne(workOrder.status, WorkOrderStatus.EXPIRED),
          ne(workOrder.status, WorkOrderStatus.COPIED),
          gte(workOrder.scheduledDate, startDateStr),
          lte(workOrder.scheduledDate, endDateStr)
        )
      )

    const workOrders = await hydrateWorkOrders(rows)

    return workOrders
  }

  // ---------------------------------------------------------------------------
  // Casos de uso transacionais
  //
  // Antes cada tela encadeava 3 a 6 mutações independentes (OS, relatório,
  // itens, vínculo, pagamento). Uma falha no meio deixava registros órfãos e o
  // reenvio duplicava a OS. Aqui cada fluxo é uma transação só.
  // ---------------------------------------------------------------------------

  private computeResultStatus(scheduledCount: number, result: ResultInput) {
    return resolveResultStatus({
      scheduled: scheduledCount,
      exchanged: result.exchanged.length,
      added: result.added.length,
      removed: result.removed.length,
    })
  }

  private insertResultItems(
    tx: AppTransaction,
    resultId: string,
    result: ResultInput
  ) {
    const rows = [
      ...result.exchanged.map((i) => ({
        ...i,
        type: WorkOrderResultItemType.EXCHANGED,
      })),
      ...result.added.map((i) => ({
        ...i,
        type: WorkOrderResultItemType.ADDED,
      })),
      ...result.removed.map((i) => ({
        ...i,
        type: WorkOrderResultItemType.REMOVED,
      })),
    ].map((i) => {
      assertValidItem(i)
      return {
        id: String(uuid.v4()),
        resultId,
        productId: i.productId,
        quantity: i.quantity,
        priceSnapshot: roundMoney(i.priceSnapshot),
        type: i.type,
        observation: i.observation ?? null,
      }
    })
    if (rows.length > 0) tx.insert(workOrderResultItem).values(rows).run()
  }

  /** Atualiza o total de um pagamento ainda não quitado. Pago não se mexe. */
  private syncUnpaidPayment(
    tx: AppTransaction,
    paymentOrderId: string | null,
    total: number
  ) {
    if (!paymentOrderId) return
    tx.update(paymentOrder)
      .set({ totalValue: total })
      .where(
        and(eq(paymentOrder.id, paymentOrderId), eq(paymentOrder.isPaid, false))
      )
      .run()
  }

  /**
   * Cria a OS com itens agendados e, opcionalmente, relatório e pagamento.
   */
  async addWorkOrderWithDetails(input: CreateWorkOrderInput): Promise<UUID> {
    const [customerRow] = await db
      .select({ id: customer.id })
      .from(customer)
      .where(eq(customer.id, input.customerId))
      .limit(1)
    if (!customerRow) throw new Error('O cliente não foi encontrado.')

    input.items.forEach(assertValidItem)

    const id = String(uuid.v4()) as UUID
    const now = new Date().toISOString()

    db.transaction((tx) => {
      let status: WorkOrderStatus = WorkOrderStatus.PENDING
      let resultId: string | null = null
      let visitDate: string | null = null
      let total = 0

      if (input.result) {
        resultId = String(uuid.v4())
        total = computeResultTotal(input.result.exchanged, input.result.added)
        status = this.computeResultStatus(input.items.length, input.result)
        visitDate = now
        tx.insert(workOrderResult)
          .values({ id: resultId, totalValue: total })
          .run()
        this.insertResultItems(tx, resultId, input.result)
      }

      let paymentOrderId: string | null = null
      if (input.payment) {
        const state = normalizePaymentState({
          installments: input.payment.installments,
          paidInstallments: input.payment.isPaid
            ? input.payment.installments
            : 0,
          isPaid: input.payment.isPaid,
        })
        paymentOrderId = String(uuid.v4())
        tx.insert(paymentOrder)
          .values({
            id: paymentOrderId,
            method: input.payment.method || 'Dinheiro',
            totalValue: roundMoney(input.payment.totalValue),
            installments: state.installments,
            isPaid: state.isPaid,
            paidInstallments: state.paidInstallments,
            paymentDate: input.payment.paymentDate ?? null,
          })
          .run()
      }

      tx.insert(workOrder)
        .values({
          id,
          customerId: input.customerId,
          createdAt: now,
          updatedAt: now,
          scheduledDate: input.scheduledDate.toISOString(),
          visitDate,
          paymentOrderId,
          status,
          resultId,
          notes: input.notes?.trim() ? input.notes : null,
        })
        .run()

      if (input.items.length > 0) {
        tx.insert(workOrderItem)
          .values(
            input.items.map((i) => ({
              id: String(uuid.v4()),
              workOrderId: id,
              productId: i.productId,
              quantity: i.quantity,
              priceSnapshot: roundMoney(i.priceSnapshot),
            }))
          )
          .run()
      }
    })

    return id
  }

  /**
   * Registra o relatório de visita de uma OS em aberto: grava relatório e
   * itens, calcula o status, marca a visita, limpa o atraso no itinerário e
   * atualiza o total de um pagamento ainda não quitado.
   */
  async addResultToWorkOrder(
    workOrderId: UUID,
    result: ResultInput
  ): Promise<UUID> {
    const [wo] = await db
      .select()
      .from(workOrder)
      .where(eq(workOrder.id, workOrderId))
      .limit(1)
    if (!wo) throw new Error('A ordem de serviço não foi encontrada.')
    if (wo.resultId)
      throw new Error('Esta ordem de serviço já possui relatório.')
    if (!isOpenStatus(wo.status))
      throw new Error(
        'Esta ordem de serviço já foi encerrada e não pode receber relatório.'
      )

    const scheduled = await db
      .select({ id: workOrderItem.id })
      .from(workOrderItem)
      .where(eq(workOrderItem.workOrderId, workOrderId))

    const resultId = String(uuid.v4()) as UUID
    const total = computeResultTotal(result.exchanged, result.added)
    const status = this.computeResultStatus(scheduled.length, result)
    const now = new Date().toISOString()

    db.transaction((tx) => {
      tx.insert(workOrderResult)
        .values({ id: resultId, totalValue: total })
        .run()
      this.insertResultItems(tx, resultId, result)
      tx.update(workOrder)
        .set({ resultId, status, visitDate: now, updatedAt: now })
        .where(eq(workOrder.id, workOrderId))
        .run()
      tx.update(itineraryWorkOrder)
        .set({ isLate: false })
        .where(eq(itineraryWorkOrder.workOrderId, workOrderId))
        .run()
      this.syncUnpaidPayment(tx, wo.paymentOrderId, total)
    })

    return resultId
  }

  /**
   * Corrige os itens de um relatório existente (substitui todos de uma vez),
   * recalcula total e status e sincroniza o pagamento não quitado.
   * Bloqueado se o pagamento já foi quitado ou a OS já foi clonada.
   */
  async updateWorkOrderResultItems(
    resultId: UUID,
    result: ResultInput
  ): Promise<void> {
    const [row] = await db
      .select({ workOrder, paymentOrder })
      .from(workOrder)
      .leftJoin(paymentOrder, eq(workOrder.paymentOrderId, paymentOrder.id))
      .where(eq(workOrder.resultId, resultId))
      .limit(1)

    if (!row)
      throw new Error('A ordem de serviço do relatório não foi encontrada.')
    if (row.paymentOrder?.isPaid)
      throw new Error(
        'O pagamento desta ordem de serviço já foi quitado: o relatório não pode ser alterado.'
      )
    if (
      !(RESULT_EDITABLE_STATUSES as readonly string[]).includes(
        row.workOrder.status
      )
    )
      throw new Error(
        'Esta ordem de serviço não permite alterar o relatório (já foi clonada ou cancelada).'
      )

    const scheduled = await db
      .select({ id: workOrderItem.id })
      .from(workOrderItem)
      .where(eq(workOrderItem.workOrderId, row.workOrder.id))

    const total = computeResultTotal(result.exchanged, result.added)
    const status = this.computeResultStatus(scheduled.length, result)

    db.transaction((tx) => {
      tx.delete(workOrderResultItem)
        .where(eq(workOrderResultItem.resultId, resultId))
        .run()
      this.insertResultItems(tx, resultId, result)
      tx.update(workOrderResult)
        .set({ totalValue: total })
        .where(eq(workOrderResult.id, resultId))
        .run()
      tx.update(workOrder)
        .set({ status, updatedAt: new Date().toISOString() })
        .where(eq(workOrder.id, row.workOrder.id))
        .run()
      this.syncUnpaidPayment(tx, row.workOrder.paymentOrderId, total)
    })
  }
}
