import {
  Address,
  AddressSerializableDTO,
} from '@/src/domain/entities/customer/value-objects/address.vo'
import {
  PhoneNumber,
  PhoneNumberSerializableDTO,
} from '@/src/domain/entities/customer/value-objects/phone-number.vo'
import { UUID } from 'crypto'

export type CustomerSerializableDTO = {
  id: UUID
  storeName: string
  storeAddress: AddressSerializableDTO
  contactName: string
  phoneNumber: PhoneNumberSerializableDTO
  landlineNumber?: PhoneNumberSerializableDTO
}

export class Customer {
  constructor(
    public id: UUID,
    public storeName: string,
    public storeAddress: Address,
    public contactName: string,
    public phoneNumber: PhoneNumber,
    public landlineNumber?: PhoneNumber
  ) {}

  isActiveWhatsApp(): boolean {
    return this.phoneNumber.isWhatsApp
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
      PhoneNumber.fromDTO(dto.phoneNumber),
      dto.landlineNumber ? PhoneNumber.fromDTO(dto.landlineNumber) : undefined
    )
  }
}
