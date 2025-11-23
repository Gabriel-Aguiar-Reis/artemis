export type ExpirationSerializableDTO = string

export const EXPIRATION_REGEX = /^(\d+)\s*([^\s]+)$/i
export class Expiration {
  private durationMs: number

  constructor(public value: string) {
    this.value = String(value).trim()
    this.durationMs = this.parseToMilliseconds(this.value)
  }

  private parseToMilliseconds(value: string): number {
    const raw = String(value).trim()
    const match = raw.match(EXPIRATION_REGEX)
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
    // Normaliza para salvar: quando a quantidade é 1, usa a forma singular
    const raw = String(this.value).trim()
    const match = raw.match(EXPIRATION_REGEX)
    if (!match) return raw

    const [, qtyStr, unitRaw] = match
    const qty = Number(qtyStr)
    if (Number.isNaN(qty)) return this.value

    // Normaliza acentos e converte para lower (remover diacríticos)
    const unit = String(unitRaw)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    // Determina a forma base da unidade (singular) preservando acentos
    // Usamos o unit (normalizado sem diacríticos) apenas para identificar a unidade
    // e retornamos a forma singular preferida com acento quando aplicável.
    let singular = unit
    if (unit.startsWith('dia')) singular = 'dia'
    else if (unit.startsWith('semana')) singular = 'semana'
    else if (unit.startsWith('mes')) singular = 'mês'
    else if (unit.startsWith('ano')) singular = 'ano'

    if (qty === 1) return `${qty} ${singular}`
    // Se qty > 1, retorna a string trimmed para evitar espaços indesejados
    return raw
  }

  static fromDTO(dto: ExpirationSerializableDTO): Expiration {
    return new Expiration(dto)
  }
}
