import { WorkOrderItemBase } from '@/src/domain/entities/work-order-item-base/work-order-item-base.entity'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { UUID } from 'crypto'

export type WorkOrderItemSerializableDTO = {
  productId: UUID
  productName: string
  salePrice: number
  quantity: number
}

export class WorkOrderItem extends WorkOrderItemBase {
  constructor(
    public productSnapshot: ProductSnapshot,
    public quantity: number,
    public priceSnapshot: number // Preço congelado no momento da venda
  ) {
    super(
      productSnapshot.productId,
      productSnapshot.productName,
      priceSnapshot,
      quantity
    )
  }

  get productId(): UUID {
    return this.productSnapshot.productId
  }

  get productName(): string {
    return this.productSnapshot.productName
  }

  get salePrice(): number {
    return this.priceSnapshot
  }

  toDTO(): WorkOrderItemSerializableDTO {
    return {
      productId: this.productSnapshot.productId,
      productName: this.productSnapshot.productName,
      salePrice: this.priceSnapshot,
      quantity: this.quantity,
    }
  }

  static fromProductSnapshot(
    snapshot: ProductSnapshot,
    quantity: number,
    priceSnapshot?: number
  ): WorkOrderItem {
    return new WorkOrderItem(
      snapshot,
      quantity,
      priceSnapshot ?? snapshot.salePrice
    )
  }

  static fromDTO(dto: WorkOrderItemSerializableDTO): WorkOrderItem {
    const snapshot = ProductSnapshot.fromDTO({
      productId: dto.productId,
      productName: dto.productName,
      salePrice: dto.salePrice,
    })

    return new WorkOrderItem(snapshot, dto.quantity, dto.salePrice)
  }
}
