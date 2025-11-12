import { UUID } from 'crypto'

export abstract class WorkOrderItemBase {
  constructor(
    public productId: UUID,
    public productName: string,
    public salePrice: number,
    public quantity: number
  ) {}

  get total() {
    return this.salePrice * this.quantity
  }
}
