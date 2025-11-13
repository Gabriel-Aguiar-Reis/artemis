import { Product } from '@/src/domain/entities/product/product.entity'
import { WorkOrderItemBase } from '@/src/domain/entities/work-order-item-base/work-order-item-base.entity'
import { UUID } from 'crypto'

export type WorkOrderItemSerializableDTO = {
  productId: UUID
  productName: string
  salePrice: number
  quantity: number
}

export class WorkOrderItem extends WorkOrderItemBase {
  constructor(
    public product: Product,
    public quantity: number,
    public priceSnapshot: number // Preço congelado no momento da venda
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

  toDTO(): WorkOrderItemSerializableDTO {
    return {
      productId: this.product.id,
      productName: this.product.name,
      salePrice: this.priceSnapshot,
      quantity: this.quantity,
    }
  }

  static fromProduct(
    product: Product,
    quantity: number,
    priceSnapshot?: number
  ): WorkOrderItem {
    return new WorkOrderItem(
      product,
      quantity,
      priceSnapshot ?? product.salePrice
    )
  }

  static fromDTO(dto: WorkOrderItemSerializableDTO): WorkOrderItem {
    // Criar um produto "fantasma" para compatibilidade com DTOs legados
    // Em produção, deveria buscar o produto real do repositório
    const product = {
      id: dto.productId,
      name: dto.productName,
      salePrice: dto.salePrice,
    } as Product

    return new WorkOrderItem(product, dto.quantity, dto.salePrice)
  }
}
