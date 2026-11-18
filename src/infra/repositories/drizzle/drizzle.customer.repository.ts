import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { Address } from '@/src/domain/entities/customer/value-objects/address.vo'
import { LandlinePhoneNumber } from '@/src/domain/entities/customer/value-objects/landline-phone-number.vo'
import { SmartphoneNumber } from '@/src/domain/entities/customer/value-objects/smartphone-number.vo'
import {
  CustomerLight,
  CustomerRepository,
  PaginatedCustomers,
} from '@/src/domain/repositories/customer/customer.repository'
import {
  CustomerInsertDTO,
  CustomerUpdateDTO,
} from '@/src/domain/validations/customer.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { containsFolded, foldedSql } from '@/src/infra/db/drizzle/sql-search'
import { normalizePhoneBrazil, UUID } from '@/src/lib/utils'
import { and, asc, count, eq, like, or } from 'drizzle-orm'
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

  /**
   * Lightweight search for comboboxes: only the columns needed, ordered and
   * limited. Accent- and case-insensitive (see sql-search.ts).
   */
  async searchCustomersLight(
    term: string,
    limit = 50
  ): Promise<CustomerLight[]> {
    const cols = {
      id: customer.id,
      storeName: customer.storeName,
      contactName: customer.contactName,
      city: customer.addressCity,
      phone: customer.phoneNumber,
    }
    const match = or(
      containsFolded(customer.storeName, term),
      containsFolded(customer.contactName, term)
    )

    return (await db
      .select(cols)
      .from(customer)
      .where(match)
      .orderBy(foldedSql(customer.storeName), asc(customer.id))
      .limit(limit)) as CustomerLight[]
  }

  async getCustomersPaginated(
    page: number,
    pageSize: number,
    filters?: CustomerFilters
  ): Promise<PaginatedCustomers> {
    const offset = (page - 1) * pageSize

    // Build filter conditions dynamically
    const conditions = []

    if (filters?.search) {
      conditions.push(
        or(
          containsFolded(customer.storeName, filters.search),
          containsFolded(customer.contactName, filters.search)
        )
      )
    }

    if (filters?.contactName) {
      conditions.push(containsFolded(customer.contactName, filters.contactName))
    }

    if (filters?.phoneNumber) {
      // Strip formatting before searching
      const phoneDigits = filters.phoneNumber.replace(/\D+/g, '')
      if (phoneDigits) {
        conditions.push(like(customer.phoneNumber, `%${phoneDigits}%`))
      }
    }

    if (filters?.landlineNumber) {
      // Strip formatting before searching
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

    // Apply WHERE with all conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Fetch the total record count and the page's records in parallel
    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(customer)
        .where(whereClause)
        // Stable order: without ORDER BY the OFFSET may repeat/skip items
        .orderBy(foldedSql(customer.storeName), asc(customer.id))
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
        streetNumber: String(dto.addressStreetNumber ?? '').trim(),
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
        streetNumber: String(dto.addressStreetNumber ?? '').trim(),
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
