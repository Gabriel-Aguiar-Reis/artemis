import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { Address } from '@/src/domain/entities/customer/value-objects/address.vo'
import { Coordinates } from '@/src/domain/entities/customer/value-objects/coordinates.vo'
import { LandlinePhoneNumber } from '@/src/domain/entities/customer/value-objects/landline-phone-number.vo'
import { SmartphoneNumber } from '@/src/domain/entities/customer/value-objects/smartphone-number.vo'
import { CustomerRepository } from '@/src/domain/repositories/customer/customer.repository'
import { AddCustomerDto } from '@/src/domain/repositories/customer/dtos/add-customer.dto'
import { UpdateCustomerDto } from '@/src/domain/repositories/customer/dtos/update-customer.dto'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzleCustomerRepository implements CustomerRepository {
  async getCustomers(): Promise<Customer[]> {
    const rows = await db.select().from(customer)
    if (rows.length === 0) {
      return []
    }
    return rows.map(CustomerMapper.toDomain)
  }

  async addCustomer(dto: AddCustomerDto): Promise<void> {
    const id = uuid.v4()

    const coordinates = Coordinates.fromDTO(dto.storeAddress.coordinates)
    const address = Address.fromDTO({ ...dto.storeAddress, coordinates })
    const smartphoneNumber = SmartphoneNumber.fromDTO(dto.phoneNumber)
    const landlineNumber = dto.landlineNumber
      ? LandlinePhoneNumber.fromDTO(dto.landlineNumber)
      : undefined

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

  async updateCustomer(dto: UpdateCustomerDto): Promise<void> {
    const coordinates = Coordinates.fromDTO(dto.storeAddress.coordinates)
    const address = Address.fromDTO({ ...dto.storeAddress, coordinates })
    const smartphoneNumber = SmartphoneNumber.fromDTO(dto.phoneNumber)
    const landlineNumber = dto.landlineNumber
      ? LandlinePhoneNumber.fromDTO(dto.landlineNumber)
      : undefined

    const _customer = new Customer(
      dto.id as UUID,
      dto.storeName,
      address,
      dto.contactName,
      smartphoneNumber,
      landlineNumber
    )

    const data = CustomerMapper.toPersistence(_customer)

    await db.update(customer).set(data).where(eq(customer.id, dto.id))
  }

  async deleteCustomer(id: UUID): Promise<void> {
    await db.delete(customer).where(eq(customer.id, id))
  }

  async getCustomer(id: UUID): Promise<Customer | null> {
    const [row] = await db.select().from(customer).where(eq(customer.id, id))

    if (!row) return null
    return CustomerMapper.toDomain(row)
  }
}
