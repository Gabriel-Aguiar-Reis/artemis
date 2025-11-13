import { Product } from '@/src/domain/entities/product/product.entity'
import { WorkOrderItemBase } from '@/src/domain/entities/work-order-item-base/work-order-item-base.entity'
import { UUID } from 'crypto'

export type WorkOrderResultItemSerializableDTO = {
  productId: UUID
  productName: string
  salePrice: number
  quantity: number
  observation?: string
}

export class WorkOrderResultItem extends WorkOrderItemBase {
  constructor(
    public product: Product,
    public quantity: number,
    public priceSnapshot: number,
    public observation?: string
  ) {
    super(product.id, product.name, priceSnapshot, quantity)
  }

  get productId(): UUID {
    return this.product.id
  }

  get productName(): string {
    return this.product.name
  }

  get salePrice(): number {
    return this.priceSnapshot
  }

  toDTO(): WorkOrderResultItemSerializableDTO {
    return {
      productId: this.product.id,
      productName: this.product.name,
      salePrice: this.priceSnapshot,
      quantity: this.quantity,
      observation: this.observation,
    }
  }

  static fromProduct(
    product: Product,
    quantity: number,
    priceSnapshot?: number,
    observation?: string
  ): WorkOrderResultItem {
    return new WorkOrderResultItem(
      product,
      quantity,
      priceSnapshot ?? product.salePrice,
      observation
    )
  }

  static fromDTO(dto: WorkOrderResultItemSerializableDTO): WorkOrderResultItem {
    // Criar um produto "fantasma" para compatibilidade
    const product = {
      id: dto.productId,
      name: dto.productName,
      salePrice: dto.salePrice,
    } as Product

    return new WorkOrderResultItem(
      product,
      dto.quantity,
      dto.salePrice,
      dto.observation
    )
  }
}
