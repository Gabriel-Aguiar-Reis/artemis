import { WorkOrderItemBase } from '@/src/domain/entities/work-order-item-base/work-order-item-base.entity'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { UUID } from '@/src/lib/utils'

export enum WorkOrderResultItemType {
  EXCHANGED = 'EXCHANGED',
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
}

export type WorkOrderResultItemSerializableDTO = {
  id: UUID
  productId: UUID
  resultId: UUID
  productName: string
  salePrice: number
  quantity: number
  type: WorkOrderResultItemType
  observation?: string
}

export class WorkOrderResultItem extends WorkOrderItemBase {
  constructor(
    public id: UUID,
    public productSnapshot: ProductSnapshot,
    public resultId: UUID,
    public quantity: number,
    public priceSnapshot: number,
    public type: WorkOrderResultItemType,
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
      id: this.id,
      productId: this.productSnapshot.productId,
      resultId: this.resultId,
      productName: this.productSnapshot.productName,
      salePrice: this.priceSnapshot,
      quantity: this.quantity,
      type: this.type,
      observation: this.observation,
    }
  }

  static fromProductSnapshot(
    id: UUID,
    snapshot: ProductSnapshot,
    resultId: UUID,
    quantity: number,
    type: WorkOrderResultItemType,
    priceSnapshot?: number,
    observation?: string
  ): WorkOrderResultItem {
    return new WorkOrderResultItem(
      id,
      snapshot,
      resultId,
      quantity,
      priceSnapshot ?? snapshot.salePrice,
      type,
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
      dto.id,
      snapshot,
      dto.resultId,
      dto.quantity,
      dto.salePrice,
      dto.type,
      dto.observation
    )
  }
}
