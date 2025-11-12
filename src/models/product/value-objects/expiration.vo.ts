export type ExpirationSerializableDTO = string

export class Expiration {
  private durationMs: number

  constructor(public value: string) {
    this.durationMs = this.parseToMilliseconds(value)
  }

  private parseToMilliseconds(value: string): number {
    const match = value.match(/(\d+)\s*(month|year|day)s?/i)
    if (!match) throw new Error('Invalid expiration format')
    const [, qty, unit] = match
    const ms = {
      day: 86400000,
      month: 2592000000,
      year: 31536000000,
    }[unit.toLowerCase()]
    if (!ms) throw new Error('Invalid time unit for expiration')
    return +qty * ms
  }

  toDate(from: Date = new Date()): Date {
    return new Date(from.getTime() + this.durationMs)
  }

  toDTO(): ExpirationSerializableDTO {
    return this.value
  }

  static fromDTO(dto: ExpirationSerializableDTO): Expiration {
    return new Expiration(dto)
  }
}
