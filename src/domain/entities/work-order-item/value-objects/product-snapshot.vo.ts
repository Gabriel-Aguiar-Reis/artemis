import { UUID } from '@/src/lib/utils'

export type ProductSnapshotSerializableDTO = {
  productId: UUID
  productName: string
  salePrice: number
}

export class ProductSnapshot {
  constructor(
    public productId: UUID,
    public productName: string,
    public salePrice: number
  ) {
    if (salePrice < 0)
      throw new Error('O preço de venda não pode ser negativo.')
  }

  toDTO(): ProductSnapshotSerializableDTO {
    return {
      productId: this.productId,
      productName: this.productName,
      salePrice: this.salePrice,
    }
  }

  static fromDTO(dto: ProductSnapshotSerializableDTO): ProductSnapshot {
    return new ProductSnapshot(dto.productId, dto.productName, dto.salePrice)
  }
}
