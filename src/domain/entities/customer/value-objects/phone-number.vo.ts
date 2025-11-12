export type PhoneNumberSerializableDTO = {
  value: string
  isWhatsApp: boolean
}

export class PhoneNumber {
  constructor(
    public value: string,
    public isWhatsApp: boolean = false
  ) {}

  toDTO(): PhoneNumberSerializableDTO {
    return {
      value: this.value,
      isWhatsApp: this.isWhatsApp,
    }
  }

  static fromDTO(dto: PhoneNumberSerializableDTO): PhoneNumber {
    return new PhoneNumber(dto.value, dto.isWhatsApp)
  }
}
