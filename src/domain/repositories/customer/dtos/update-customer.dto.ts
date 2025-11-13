import { AddressSerializableDTO } from '@/src/domain/entities/customer/value-objects/address.vo'
import { PhoneNumberSerializableDTO } from '@/src/domain/entities/customer/value-objects/smartphone-number.vo'

export interface UpdateCustomerDto {
  id: string
  storeName: string
  storeAddress: AddressSerializableDTO
  contactName: string
  phoneNumber: PhoneNumberSerializableDTO
  landlineNumber?: PhoneNumberSerializableDTO
}
