export type AddressSerializableDTO = {
  streetName: string
  streetNumber: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export class Address {
  constructor(
    public streetName: string,
    public streetNumber: string,
    public neighborhood: string,
    public city: string,
    public state: string,
    public zipCode: string
  ) {}

  getFullAddress(): string {
    // Zip codes may be stored formatted ("01234-567") or as digits only
    const zip = this.zipCode.replace(/\D/g, '')
    const formattedZip =
      zip.length === 8 ? `${zip.slice(0, 5)}-${zip.slice(5)}` : this.zipCode
    return `${this.streetName}, ${this.streetNumber} - ${this.neighborhood}, ${this.city} - ${this.state}, ${formattedZip}`
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
