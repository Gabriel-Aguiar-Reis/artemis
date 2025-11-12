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
      throw new Error('Latitude must be between -90 and 90')
    if (longitude < -180 || longitude > 180)
      throw new Error('Longitude must be between -180 and 180')
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
