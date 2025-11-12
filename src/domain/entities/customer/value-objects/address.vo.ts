import {
  Coordinates,
  CoordinatesSerializableDTO,
} from '@/src/domain/entities/customer/value-objects/coordinates.vo'

export type AddressSerializableDTO = {
  streetName: string
  streetNumber: number
  neighborhood: string
  city: string
  coordinates: CoordinatesSerializableDTO
  zipCode: string
}

export class Address {
  constructor(
    public streetName: string,
    public streetNumber: number,
    public neighborhood: string,
    public city: string,
    public coordinates: Coordinates,
    public zipCode: string
  ) {}

  toDTO(): AddressSerializableDTO {
    return {
      streetName: this.streetName,
      streetNumber: this.streetNumber,
      neighborhood: this.neighborhood,
      city: this.city,
      coordinates: this.coordinates?.toDTO
        ? this.coordinates.toDTO()
        : this.coordinates,
      zipCode: this.zipCode,
    }
  }

  static fromDTO(dto: AddressSerializableDTO): Address {
    return new Address(
      dto.streetName,
      dto.streetNumber,
      dto.neighborhood,
      dto.city,
      Coordinates.fromDTO(dto.coordinates),
      dto.zipCode
    )
  }
}
