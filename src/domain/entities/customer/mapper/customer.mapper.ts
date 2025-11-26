import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { CustomerTable } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { UUID } from '@/src/lib/utils'

export class CustomerMapper {
  static toDomain(table: CustomerTable): Customer {
    if (!table.storeName || !table.contactName || !table.phoneNumber) {
      throw new Error(
        'Cliente deve ter nome da loja, nome do contato e número de telefone'
      )
    }

    const customer = Customer.fromDTO({
      id: table.id as UUID,
      storeName: table.storeName,
      storeAddress: {
        streetName: table.addressStreetName ?? '',
        streetNumber: table.addressStreetNumber ?? 0,
        neighborhood: table.addressNeighborhood ?? '',
        city: table.addressCity ?? '',
        state: table.addressState ?? '',
        zipCode: table.addressZipCode ?? '',
      },
      contactName: table.contactName,
      phoneNumber: {
        value: table.phoneNumber,
        isWhatsApp: table.phoneIsWhatsApp,
      },
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
      phoneNumber: entity.phoneNumber.value,
      phoneIsWhatsApp: entity.phoneNumber.isWhatsApp,
      landlineNumber: entity.landlineNumber?.value ?? null,
      landlineIsWhatsApp: entity.landlineNumber?.isWhatsApp ?? null,
      addressStreetName: entity.storeAddress.streetName,
      addressStreetNumber: entity.storeAddress.streetNumber,
      addressNeighborhood: entity.storeAddress.neighborhood,
      addressCity: entity.storeAddress.city,
      addressState: entity.storeAddress.state,
      addressZipCode: entity.storeAddress.zipCode,
    }
  }
}
