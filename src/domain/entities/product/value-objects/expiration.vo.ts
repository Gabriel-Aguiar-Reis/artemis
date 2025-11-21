export type ExpirationSerializableDTO = string

export const EXPIRATION_REGEX = /^(\d+)\s*([^\s]+)$/i
export class Expiration {
  private durationMs: number

  constructor(public value: string) {
    this.durationMs = this.parseToMilliseconds(value)
  }

  private parseToMilliseconds(value: string): number {
    const match = value.match(EXPIRATION_REGEX)
    if (!match) throw new Error('O formato de expiração é inválido.')
    const [, qtyStr, unitRaw] = match
    const qty = Number(qtyStr)
    if (Number.isNaN(qty) || qty <= 0)
      throw new Error('Quantidade inválida na expiração.')

    // Normaliza acentos e converte para lower
    // Normaliza acentos e converte para lower (remover apenas diacríticos)
    const unit = String(unitRaw)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    let ms: number | undefined
    if (unit.startsWith('dia')) ms = 24 * 60 * 60 * 1000
    else if (unit.startsWith('semana')) ms = 7 * 24 * 60 * 60 * 1000
    else if (unit.startsWith('mes')) ms = 30 * 24 * 60 * 60 * 1000
    else if (unit.startsWith('ano')) ms = 365 * 24 * 60 * 60 * 1000

    if (!ms) throw new Error('Unidade de tempo inválida para expiração.')

    return qty * ms
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
