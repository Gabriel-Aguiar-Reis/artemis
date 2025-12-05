export type ExpirationSerializableDTO = string

// Aceita formatos como: "30 dias", "30dias", "1 mês", "2 semanas", etc.
export const EXPIRATION_REGEX = /^(\d+)\s*(.+)$/i

export class Expiration {
  private durationMs: number

  constructor(public value: string) {
    this.value = String(value).trim()
    this.durationMs = this.parseToMilliseconds(this.value)
  }

  private parseToMilliseconds(value: string): number {
    const raw = String(value).trim()
    const match = raw.match(EXPIRATION_REGEX)
    if (!match) {
      throw new Error(
        'Formato de validade inválido. Use: número + unidade (ex: "30 dias", "1 mês", "2 semanas")'
      )
    }

    const [, qtyStr, unitRaw] = match
    const qty = Number(qtyStr)

    if (Number.isNaN(qty) || qty <= 0) {
      throw new Error(
        'Quantidade inválida. Use um número maior que zero (ex: "30 dias", "1 mês")'
      )
    }

    // Normaliza acentos e converte para lower
    const unit = String(unitRaw)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

    let ms: number | undefined

    // Aceita variações comuns (plural, singular, abreviações)
    if (/^dias?$/.test(unit) || /^d$/.test(unit)) {
      ms = 24 * 60 * 60 * 1000
    } else if (
      /^semanas?$/.test(unit) ||
      /^sem$/.test(unit) ||
      /^s$/.test(unit)
    ) {
      ms = 7 * 24 * 60 * 60 * 1000
    } else if (/^mes(es)?$/.test(unit) || /^m$/.test(unit)) {
      ms = 30 * 24 * 60 * 60 * 1000
    } else if (/^anos?$/.test(unit) || /^a$/.test(unit)) {
      ms = 365 * 24 * 60 * 60 * 1000
    }

    if (!ms) {
      throw new Error(
        `Unidade "${unitRaw}" não reconhecida. Use: dias, semanas, meses ou anos`
      )
    }

    return qty * ms
  }

  toDate(from: Date = new Date()): Date {
    return new Date(from.getTime() + this.durationMs)
  }

  toDTO(): ExpirationSerializableDTO {
    // Normaliza para salvar: quando a quantidade é 1, usa a forma singular
    const raw = String(this.value).trim()
    const match = raw.match(EXPIRATION_REGEX)
    if (!match) return raw

    const [, qtyStr, unitRaw] = match
    const qty = Number(qtyStr)
    if (Number.isNaN(qty)) return this.value

    // Normaliza acentos e converte para lower
    const unit = String(unitRaw)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

    // Determina a forma padrão da unidade
    let unitName = unit
    if (/^dias?$/.test(unit) || /^d$/.test(unit)) {
      unitName = qty === 1 ? 'dia' : 'dias'
    } else if (
      /^semanas?$/.test(unit) ||
      /^sem$/.test(unit) ||
      /^s$/.test(unit)
    ) {
      unitName = qty === 1 ? 'semana' : 'semanas'
    } else if (/^mes(es)?$/.test(unit) || /^m$/.test(unit)) {
      unitName = qty === 1 ? 'mês' : 'meses'
    } else if (/^anos?$/.test(unit) || /^a$/.test(unit)) {
      unitName = qty === 1 ? 'ano' : 'anos'
    }

    return `${qty} ${unitName}`
  }

  static fromDTO(dto: ExpirationSerializableDTO): Expiration {
    return new Expiration(dto)
  }
}
