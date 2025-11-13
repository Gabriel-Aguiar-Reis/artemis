import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { Address } from '@/src/domain/entities/customer/value-objects/address.vo'
import { Coordinates } from '@/src/domain/entities/customer/value-objects/coordinates.vo'
import { LandlinePhoneNumber } from '@/src/domain/entities/customer/value-objects/landline-phone-number.vo'
import { SmartphoneNumber } from '@/src/domain/entities/customer/value-objects/smartphone-number.vo'
import { CustomerTable } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { UUID } from 'crypto'

export class CustomerMapper {
  static toDomain(table: CustomerTable): Customer {
    // Validar dados obrigatórios
    if (!table.storeName || !table.contactName || !table.phoneNumber) {
      throw new Error(
        'Customer must have store name, contact name, and phone number'
      )
    }

    if (
      table.addressLatitude === null ||
      table.addressLatitude === undefined ||
      table.addressLongitude === null ||
      table.addressLongitude === undefined
    ) {
      throw new Error('Customer must have valid coordinates')
    }

    const coordinates = new Coordinates(
      table.addressLatitude,
      table.addressLongitude
    )

    const address = new Address(
      table.addressStreetName ?? '',
      table.addressStreetNumber ?? 0,
      table.addressNeighborhood ?? '',
      table.addressCity ?? '',
      coordinates,
      table.addressZipCode ?? ''
    )

    const phoneNumber = new SmartphoneNumber(
      table.phoneNumber,
      table.phoneIsWhatsApp
    )

    const landlineNumber = table.landlineNumber
      ? new LandlinePhoneNumber(
          table.landlineNumber,
          table.landlineIsWhatsApp ?? false
        )
      : undefined

    return new Customer(
      table.id as UUID,
      table.storeName,
      address,
      table.contactName,
      phoneNumber,
      landlineNumber
    )
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
      addressZipCode: entity.storeAddress.zipCode,
      addressLatitude: entity.storeAddress.coordinates.latitude,
      addressLongitude: entity.storeAddress.coordinates.longitude,
    }
  }
}
