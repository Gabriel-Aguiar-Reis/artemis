import { WorkOrderItemBase } from '@/src/models/work-order/work-order-item-base.model'
import { UUID } from 'crypto'

export type WorkOrderItemSerializableDTO = {
  productId: UUID
  productName: string
  salePrice: number
  quantity: number
}

export class WorkOrderItem extends WorkOrderItemBase {
  constructor(
    public productId: UUID,
    public productName: string,
    public salePrice: number,
    public quantity: number
  ) {
    super(productId, productName, salePrice, quantity)
  }

  toDTO(): WorkOrderItemSerializableDTO {
    return {
      productId: this.productId,
      productName: this.productName,
      salePrice: this.salePrice,
      quantity: this.quantity,
    }
  }

  static fromDTO(dto: WorkOrderItemSerializableDTO): WorkOrderItem {
    return new WorkOrderItem(
      dto.productId,
      dto.productName,
      dto.salePrice,
      dto.quantity
    )
  }
}
