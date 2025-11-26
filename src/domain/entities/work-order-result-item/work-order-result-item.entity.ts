import { WorkOrderItemBase } from '@/src/domain/entities/work-order-item-base/work-order-item-base.entity'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { UUID } from '@/src/lib/utils'

export type WorkOrderResultItemSerializableDTO = {
  productId: UUID
  productName: string
  salePrice: number
  quantity: number
  observation?: string
}

export class WorkOrderResultItem extends WorkOrderItemBase {
  constructor(
    public productSnapshot: ProductSnapshot,
    public quantity: number,
    public priceSnapshot: number,
    public observation?: string
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

  toDTO(): WorkOrderResultItemSerializableDTO {
    return {
      productId: this.productSnapshot.productId,
      productName: this.productSnapshot.productName,
      salePrice: this.priceSnapshot,
      quantity: this.quantity,
      observation: this.observation,
    }
  }

  static fromProductSnapshot(
    snapshot: ProductSnapshot,
    quantity: number,
    priceSnapshot?: number,
    observation?: string
  ): WorkOrderResultItem {
    return new WorkOrderResultItem(
      snapshot,
      quantity,
      priceSnapshot ?? snapshot.salePrice,
      observation
    )
  }

  static fromDTO(dto: WorkOrderResultItemSerializableDTO): WorkOrderResultItem {
    const snapshot = ProductSnapshot.fromDTO({
      productId: dto.productId,
      productName: dto.productName,
      salePrice: dto.salePrice,
    })

    return new WorkOrderResultItem(
      snapshot,
      dto.quantity,
      dto.salePrice,
      dto.observation
    )
  }
}
