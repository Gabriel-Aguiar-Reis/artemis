export type LandlinePhoneNumberSerializableDTO = {
  value: string
  isWhatsApp: boolean
}

export class LandlinePhoneNumber {
  constructor(
    public value: string,
    public isWhatsApp: boolean = false
  ) {
    if (!/^\d+$/.test(value)) {
      throw new Error('Landline phone number must contain only digits.')
    }
  }

  toDTO(): LandlinePhoneNumberSerializableDTO {
    return {
      value: this.value,
      isWhatsApp: this.isWhatsApp,
    }
  }

  static fromDTO(dto: LandlinePhoneNumberSerializableDTO): LandlinePhoneNumber {
    return new LandlinePhoneNumber(dto.value, dto.isWhatsApp)
  }
}
