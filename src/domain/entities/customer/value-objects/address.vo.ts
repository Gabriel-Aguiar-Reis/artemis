export type AddressSerializableDTO = {
  streetName: string
  streetNumber: number
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export class Address {
  constructor(
    public streetName: string,
    public streetNumber: number,
    public neighborhood: string,
    public city: string,
    public state: string,
    public zipCode: string
  ) {}

  getFullAddress(): string {
    return `${this.streetName}, ${this.streetNumber} - ${this.neighborhood}, ${this.city} - ${this.state}, ${this.zipCode.slice(0, 5)}-${this.zipCode.slice(5)}`
  }

  toDTO(): AddressSerializableDTO {
    return {
      streetName: this.streetName,
      streetNumber: this.streetNumber,
      neighborhood: this.neighborhood,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
    }
  }

  static fromDTO(dto: AddressSerializableDTO): Address {
    return new Address(
      dto.streetName,
      dto.streetNumber,
      dto.neighborhood,
      dto.city,
      dto.state,
      dto.zipCode
    )
  }
}
