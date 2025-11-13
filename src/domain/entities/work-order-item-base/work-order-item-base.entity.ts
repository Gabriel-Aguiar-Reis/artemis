import { UUID } from 'crypto'

export abstract class WorkOrderItemBase {
  constructor(
    protected _productId: UUID,
    protected _productName: string,
    protected _salePrice: number,
    public quantity: number
  ) {}

  abstract get productId(): UUID
  abstract get productName(): string
  abstract get salePrice(): number

  get total() {
    return this.salePrice * this.quantity
  }
}
