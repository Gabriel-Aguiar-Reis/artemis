import {
  WorkOrderResultItem,
  WorkOrderResultItemSerializableDTO,
} from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { UUID } from '@/src/lib/utils'

export type WorkOrderResultSerializableDTO = {
  id: UUID
  totalValue: number
  exchangedProducts: WorkOrderResultItemSerializableDTO[]
  addedProducts?: WorkOrderResultItemSerializableDTO[]
  removedProducts?: WorkOrderResultItemSerializableDTO[]
}

export class WorkOrderResult {
  constructor(
    public id: UUID,
    public totalValue: number,

    public exchangedProducts: WorkOrderResultItem[],
    public addedProducts?: WorkOrderResultItem[],
    public removedProducts?: WorkOrderResultItem[]
  ) {}

  getExchangedAndAddedProducts(): WorkOrderResultItem[] {
    return [...this.exchangedProducts, ...(this.addedProducts ?? [])]
  }

  toDTO(): WorkOrderResultSerializableDTO {
    return {
      id: this.id,
      totalValue: this.totalValue,
      exchangedProducts: this.exchangedProducts?.map((p) => p.toDTO()),
      addedProducts: this.addedProducts?.map((p) => p.toDTO()),
      removedProducts: this.removedProducts?.map((p) => p.toDTO()),
    }
  }

  static fromDTO(dto: WorkOrderResultSerializableDTO): WorkOrderResult {
    return new WorkOrderResult(
      dto.id,
      dto.totalValue,
      dto.exchangedProducts?.map((p) => WorkOrderResultItem.fromDTO(p)) ?? [],
      dto.addedProducts?.map((p) => WorkOrderResultItem.fromDTO(p)),
      dto.removedProducts?.map((p) => WorkOrderResultItem.fromDTO(p))
    )
  }
}
