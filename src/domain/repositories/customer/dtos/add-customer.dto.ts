import { AddressSerializableDTO } from '@/src/domain/entities/customer/value-objects/address.vo'
import { LandlinePhoneNumberSerializableDTO } from '@/src/domain/entities/customer/value-objects/landline-phone-number.vo'
import { SmartphoneNumberSerializableDTO } from '@/src/domain/entities/customer/value-objects/smartphone-number.vo'

export interface AddCustomerDto {
  storeName: string
  storeAddress: AddressSerializableDTO
  contactName: string
  phoneNumber: SmartphoneNumberSerializableDTO
  landlineNumber?: LandlinePhoneNumberSerializableDTO
}
