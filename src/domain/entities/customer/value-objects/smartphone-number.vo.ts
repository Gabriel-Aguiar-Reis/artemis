export type SmartphoneNumberSerializableDTO = {
  value: string
  isWhatsApp: boolean
}

export class SmartphoneNumber {
  constructor(
    public value: string,
    public isWhatsApp: boolean = false
  ) {
    if (!/^\d+$/.test(value)) {
      throw new Error('Smartphone number must contain only digits.')
    }
  }

  toDTO(): SmartphoneNumberSerializableDTO {
    return {
      value: this.value,
      isWhatsApp: this.isWhatsApp,
    }
  }

  static fromDTO(dto: SmartphoneNumberSerializableDTO): SmartphoneNumber {
    return new SmartphoneNumber(dto.value, dto.isWhatsApp)
  }
}
