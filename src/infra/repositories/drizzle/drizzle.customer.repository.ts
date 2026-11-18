import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { Address } from '@/src/domain/entities/customer/value-objects/address.vo'
import { LandlinePhoneNumber } from '@/src/domain/entities/customer/value-objects/landline-phone-number.vo'
import { SmartphoneNumber } from '@/src/domain/entities/customer/value-objects/smartphone-number.vo'
import {
  CustomerRepository,
  PaginatedCustomers,
} from '@/src/domain/repositories/customer/customer.repository'
import {
  CustomerInsertDTO,
  CustomerUpdateDTO,
} from '@/src/domain/validations/customer.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { normalizePhoneBrazil, UUID } from '@/src/lib/utils'
import { and, count, eq, like, or } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export interface CustomerFilters {
  search?: string
  contactName?: string
  phoneNumber?: string
  landlineNumber?: string
  isActiveWhatsApp?: string
}

export default class DrizzleCustomerRepository implements CustomerRepository {
  async getCustomers(): Promise<Customer[]> {
    const rows = await db.select().from(customer)
    if (rows.length === 0) {
      return []
    }
    return rows.map(CustomerMapper.toDomain)
  }

  async getCustomersPaginated(
    page: number,
    pageSize: number,
    filters?: CustomerFilters
  ): Promise<PaginatedCustomers> {
    const offset = (page - 1) * pageSize

    // Construir condições de filtro dinamicamente
    const conditions = []

    if (filters?.search) {
      conditions.push(
        or(
          like(customer.storeName, `%${filters.search}%`),
          like(customer.contactName, `%${filters.search}%`)
        )
      )
    }

    if (filters?.contactName) {
      conditions.push(like(customer.contactName, `%${filters.contactName}%`))
    }

    if (filters?.phoneNumber) {
      // Remove formatação antes de buscar
      const phoneDigits = filters.phoneNumber.replace(/\D+/g, '')
      if (phoneDigits) {
        conditions.push(like(customer.phoneNumber, `%${phoneDigits}%`))
      }
    }

    if (filters?.landlineNumber) {
      // Remove formatação antes de buscar
      const landlineDigits = filters.landlineNumber.replace(/\D+/g, '')
      if (landlineDigits) {
        conditions.push(like(customer.landlineNumber, `%${landlineDigits}%`))
      }
    }

    if (filters?.isActiveWhatsApp && filters.isActiveWhatsApp !== 'all') {
      const isWhatsApp = filters.isActiveWhatsApp === 'true'
      conditions.push(
        or(
          eq(customer.phoneIsWhatsApp, isWhatsApp),
          eq(customer.landlineIsWhatsApp, isWhatsApp)
        )
      )
    }

    // Aplicar WHERE com todas as condições
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Busca total de registros e registros da página em paralelo
    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(customer)
        .where(whereClause)
        .limit(pageSize)
        .offset(offset),
      db.select({ count: count() }).from(customer).where(whereClause),
    ])

    const totalCount = totalResult[0]?.count ?? 0
    const hasMore = offset + rows.length < totalCount

    return {
      data: rows.map(CustomerMapper.toDomain),
      hasMore,
      totalCount,
    }
  }

  async addCustomer(dto: CustomerInsertDTO): Promise<void> {
    const id = String(uuid.v4())

    let address: Address | undefined
    if (
      dto.addressStreetName &&
      dto.addressStreetNumber &&
      dto.addressNeighborhood &&
      dto.addressCity &&
      dto.addressState &&
      dto.addressZipCode
    ) {
      address = Address.fromDTO({
        streetName: dto.addressStreetName,
        streetNumber: Number(dto.addressStreetNumber),
        neighborhood: dto.addressNeighborhood,
        city: dto.addressCity,
        state: dto.addressState,
        zipCode: dto.addressZipCode,
      })
    } else {
      throw new Error('Endereço incompleto para cadastro de cliente.')
    }

    let smartphoneNumber: SmartphoneNumber | undefined
    if (dto.phoneNumber && typeof dto.phoneIsWhatsApp === 'boolean') {
      smartphoneNumber = SmartphoneNumber.fromDTO({
        value: normalizePhoneBrazil(dto.phoneNumber),
        isWhatsApp: dto.phoneIsWhatsApp,
      })
    }

    let landlineNumber: LandlinePhoneNumber | undefined
    if (dto.landlineNumber && typeof dto.landlineIsWhatsApp === 'boolean') {
      landlineNumber = LandlinePhoneNumber.fromDTO({
        value: normalizePhoneBrazil(dto.landlineNumber),
        isWhatsApp: dto.landlineIsWhatsApp,
      })
    }

    const _customer = new Customer(
      id as UUID,
      dto.storeName,
      address,
      dto.contactName,
      smartphoneNumber,
      landlineNumber
    )

    const data = CustomerMapper.toPersistence(_customer)
    await db.insert(customer).values(data).onConflictDoNothing()
  }

  async updateCustomer(dto: CustomerUpdateDTO): Promise<void> {
    if (!dto.id)
      throw new Error('O ID do cliente é obrigatório para atualização.')

    const original = await this.getCustomer(dto.id as UUID)

    if (!original)
      throw new Error('O cliente que você está tentando atualizar não existe.')

    let address: Address | undefined
    if (
      dto.addressStreetName &&
      dto.addressStreetNumber &&
      dto.addressNeighborhood &&
      dto.addressCity &&
      dto.addressState &&
      dto.addressZipCode
    ) {
      address = Address.fromDTO({
        streetName: dto.addressStreetName,
        streetNumber: Number(dto.addressStreetNumber),
        neighborhood: dto.addressNeighborhood,
        city: dto.addressCity,
        state: dto.addressState,
        zipCode: dto.addressZipCode,
      })
    }

    let smartphoneNumber: SmartphoneNumber | undefined
    if (dto.phoneNumber && typeof dto.phoneIsWhatsApp === 'boolean') {
      smartphoneNumber = SmartphoneNumber.fromDTO({
        value: normalizePhoneBrazil(dto.phoneNumber),
        isWhatsApp: dto.phoneIsWhatsApp,
      })
    }

    let landlineNumber: LandlinePhoneNumber | undefined
    if (dto.landlineNumber && typeof dto.landlineIsWhatsApp === 'boolean') {
      landlineNumber = LandlinePhoneNumber.fromDTO({
        value: normalizePhoneBrazil(dto.landlineNumber),
        isWhatsApp: dto.landlineIsWhatsApp,
      })
    }

    const _customer = new Customer(
      dto.id as UUID,
      dto.storeName ?? original.storeName,
      address ?? original.storeAddress,
      dto.contactName ?? original.contactName,
      smartphoneNumber ?? original.phoneNumber,
      landlineNumber ?? original.landlineNumber
    )

    const data = CustomerMapper.toPersistence(_customer)

    await db.update(customer).set(data).where(eq(customer.id, dto.id))
  }

  async deleteCustomer(id: UUID): Promise<void> {
    await db.delete(customer).where(eq(customer.id, id))
  }

  async getCustomer(id: UUID): Promise<Customer | null> {
    const row = db
      .select()
      .from(customer)
      .where(eq(customer.id, id))
      .limit(1)
      .get()

    if (!row) throw new Error('O cliente não foi encontrado.')
    return CustomerMapper.toDomain(row)
  }
}
