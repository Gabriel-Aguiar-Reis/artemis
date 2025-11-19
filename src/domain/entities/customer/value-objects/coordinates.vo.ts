export type CoordinatesSerializableDTO = {
  latitude: number
  longitude: number
}

export class Coordinates {
  constructor(
    public latitude: number,
    public longitude: number
  ) {
    if (latitude < -90 || latitude > 90)
      throw new Error('A latitude informada é inválida.')
    if (longitude < -180 || longitude > 180)
      throw new Error('A longitude informada é inválida.')
  }

  toDTO(): CoordinatesSerializableDTO {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    }
  }

  static fromDTO(dto: CoordinatesSerializableDTO): Coordinates {
    return new Coordinates(dto.latitude, dto.longitude)
  }
}
