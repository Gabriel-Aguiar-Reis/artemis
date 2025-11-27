import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { CustomerTable } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { UUID } from '@/src/lib/utils'

export class CustomerMapper {
  static toDomain(table: CustomerTable): Customer {
    if (!table.storeName || !table.contactName) {
      throw new Error(
        'Cliente deve ter nome do estabelecimento e nome do contato.'
      )
    }

    const customer = Customer.fromDTO({
      id: table.id as UUID,
      storeName: table.storeName,
      storeAddress: {
        streetName: table.addressStreetName ?? '',
        streetNumber: Number(table.addressStreetNumber) ?? 0,
        neighborhood: table.addressNeighborhood ?? '',
        city: table.addressCity ?? '',
        state: table.addressState ?? '',
        zipCode: table.addressZipCode ?? '',
      },
      contactName: table.contactName,
      phoneNumber: table.phoneNumber
        ? {
            value: table.phoneNumber,
            isWhatsApp: table.phoneIsWhatsApp ?? false,
          }
        : undefined,
      landlineNumber: table.landlineNumber
        ? {
            value: table.landlineNumber,
            isWhatsApp: table.landlineIsWhatsApp ?? false,
          }
        : undefined,
    })

    return customer
  }

  static toPersistence(entity: Customer): CustomerTable {
    return {
      id: entity.id,
      storeName: entity.storeName,
      contactName: entity.contactName,
      phoneNumber: entity.phoneNumber?.value ?? null,
      phoneIsWhatsApp: entity.phoneNumber?.isWhatsApp ?? null,
      landlineNumber: entity.landlineNumber?.value ?? null,
      landlineIsWhatsApp: entity.landlineNumber?.isWhatsApp ?? null,
      addressStreetName: entity.storeAddress.streetName,
      addressStreetNumber: entity.storeAddress.streetNumber.toString(),
      addressNeighborhood: entity.storeAddress.neighborhood,
      addressCity: entity.storeAddress.city,
      addressState: entity.storeAddress.state,
      addressZipCode: entity.storeAddress.zipCode,
    }
  }
}
