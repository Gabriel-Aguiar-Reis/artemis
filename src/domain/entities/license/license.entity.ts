import { UUID } from '@/src/lib/utils'

export type LicenseSerializableDTO = {
  id: UUID
  uniqueCode: string
  expirationDate: string // YYYY-MM-DD
  isAdmin: boolean
  createdAt: string
}

export class License {
  constructor(
    public id: UUID,
    public uniqueCode: string,
    public expirationDate: Date,
    public isAdmin: boolean,
    public createdAt: Date
  ) {}

  isExpired(): boolean {
    return new Date() > this.expirationDate
  }

  isLifetime(): boolean {
    return this.expirationDate.getFullYear() >= 2150
  }

  getDaysRemaining(): number {
    const now = new Date()
    const diffTime = this.expirationDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  toDTO(): LicenseSerializableDTO {
    return {
      id: this.id,
      uniqueCode: this.uniqueCode,
      expirationDate: this.expirationDate.toISOString().split('T')[0],
      isAdmin: this.isAdmin,
      createdAt: this.createdAt.toISOString(),
    }
  }

  static fromDTO(dto: LicenseSerializableDTO): License {
    return new License(
      dto.id,
      dto.uniqueCode,
      new Date(dto.expirationDate),
      dto.isAdmin,
      new Date(dto.createdAt)
    )
  }
}
