import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { Address } from '@/src/domain/entities/customer/value-objects/address.vo'
import { LandlinePhoneNumber } from '@/src/domain/entities/customer/value-objects/landline-phone-number.vo'
import { SmartphoneNumber } from '@/src/domain/entities/customer/value-objects/smartphone-number.vo'
import { CustomerRepository } from '@/src/domain/repositories/customer/customer.repository'
import {
  CustomerInsertDTO,
  CustomerUpdateDTO,
} from '@/src/domain/validations/customer.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { UUID } from '@/src/lib/utils'
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
        value: dto.phoneNumber!,
        isWhatsApp: dto.phoneIsWhatsApp,
      })
    }

    let landlineNumber: LandlinePhoneNumber | undefined
    if (dto.landlineNumber && typeof dto.landlineIsWhatsApp === 'boolean') {
      landlineNumber = LandlinePhoneNumber.fromDTO({
        value: dto.landlineNumber!,
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
        value: dto.phoneNumber!,
        isWhatsApp: dto.phoneIsWhatsApp,
      })
    }

    let landlineNumber: LandlinePhoneNumber | undefined
    if (dto.landlineNumber && typeof dto.landlineIsWhatsApp === 'boolean') {
      landlineNumber = LandlinePhoneNumber.fromDTO({
        value: dto.landlineNumber!,
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
    const [row] = await db.select().from(customer).where(eq(customer.id, id))

    if (!row) throw new Error('O cliente não foi encontrado.')
    return CustomerMapper.toDomain(row)
  }
}
