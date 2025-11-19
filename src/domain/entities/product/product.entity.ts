import {
  Expiration,
  ExpirationSerializableDTO,
} from '@/src/domain/entities/product/value-objects/expiration.vo'
import { UUID } from 'crypto'

export type ProductSerializableDTO = {
  id: UUID
  name: string
  categoryId: UUID
  salePrice: number
  isActive: boolean
  expiration: ExpirationSerializableDTO
}

export class Product {
  constructor(
    public id: UUID,
    public name: string,
    public categoryId: UUID,
    public salePrice: number,
    public isActive: boolean,
    public expiration: Expiration
  ) {
    if (salePrice < 0)
      throw new Error('O preço de venda não pode ser negativo.')
  }

  isExpired(referenceDate: Date = new Date()): boolean {
    return this.expiration.toDate() < referenceDate
  }

  toDTO(): ProductSerializableDTO {
    return {
      id: this.id,
      name: this.name,
      categoryId: this.categoryId,
      salePrice: this.salePrice,
      isActive: this.isActive,
      expiration: this.expiration.toDTO(),
    }
  }

  static fromDTO(dto: ProductSerializableDTO): Product {
    return new Product(
      dto.id,
      dto.name,
      dto.categoryId,
      dto.salePrice,
      dto.isActive,
      Expiration.fromDTO(dto.expiration)
    )
  }
}
