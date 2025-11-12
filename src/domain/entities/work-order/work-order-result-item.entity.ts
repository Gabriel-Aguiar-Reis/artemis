import { WorkOrderItemBase } from '@/src/domain/entities/work-order/work-order-item-base.entity'
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
    public productId: UUID,
    public productName: string,
    public salePrice: number,
    public quantity: number,
    public observation?: string
  ) {
    super(productId, productName, salePrice, quantity)
    this.observation = observation
  }

  toDTO(): WorkOrderResultItemSerializableDTO {
    return {
      productId: this.productId,
      productName: this.productName,
      salePrice: this.salePrice,
      quantity: this.quantity,
      observation: this.observation,
    }
  }

  static fromDTO(dto: WorkOrderResultItemSerializableDTO): WorkOrderResultItem {
    return new WorkOrderResultItem(
      dto.productId,
      dto.productName,
      dto.salePrice,
      dto.quantity,
      dto.observation
    )
  }
}
