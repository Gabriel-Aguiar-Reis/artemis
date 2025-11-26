import {
  Address,
  AddressSerializableDTO,
} from '@/src/domain/entities/customer/value-objects/address.vo'
import {
  LandlinePhoneNumber,
  LandlinePhoneNumberSerializableDTO,
} from '@/src/domain/entities/customer/value-objects/landline-phone-number.vo'
import {
  SmartphoneNumber,
  SmartphoneNumberSerializableDTO,
} from '@/src/domain/entities/customer/value-objects/smartphone-number.vo'
import { UUID } from '@/src/lib/utils'

export type CustomerSerializableDTO = {
  id: UUID
  storeName: string
  storeAddress: AddressSerializableDTO
  contactName: string
  phoneNumber: SmartphoneNumberSerializableDTO
  landlineNumber?: LandlinePhoneNumberSerializableDTO
}

export class Customer {
  constructor(
    public id: UUID,
    public storeName: string,
    public storeAddress: Address,
    public contactName: string,
    public phoneNumber: SmartphoneNumber,
    public landlineNumber?: LandlinePhoneNumber
  ) {}

  isActiveWhatsApp(): boolean {
    return this.phoneNumber.isWhatsApp || !!this.landlineNumber?.isWhatsApp
  }

  toDTO(): CustomerSerializableDTO {
    return {
      id: this.id,
      storeName: this.storeName,
      storeAddress: this.storeAddress?.toDTO
        ? this.storeAddress.toDTO()
        : this.storeAddress,
      contactName: this.contactName,
      phoneNumber: this.phoneNumber?.toDTO
        ? this.phoneNumber.toDTO()
        : this.phoneNumber,
      landlineNumber: this.landlineNumber?.toDTO
        ? this.landlineNumber.toDTO()
        : this.landlineNumber,
    }
  }

  static fromDTO(dto: CustomerSerializableDTO): Customer {
    return new Customer(
      dto.id,
      dto.storeName,
      Address.fromDTO(dto.storeAddress),
      dto.contactName,
      SmartphoneNumber.fromDTO(dto.phoneNumber),
      dto.landlineNumber
        ? LandlinePhoneNumber.fromDTO(dto.landlineNumber)
        : undefined
    )
  }
}
