import { Product } from '@/src/domain/entities/product/product.entity'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import {
  WorkOrderResultItem,
  WorkOrderResultItemSerializableDTO,
  WorkOrderResultItemType,
} from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { UUID } from '@/src/lib/utils'

export type WorkOrderResultSerializableDTO = {
  id: UUID
  totalValue: number
  items?: WorkOrderResultItemSerializableDTO[]
}

export class WorkOrderResult {
  constructor(
    public id: UUID,
    public totalValue: number,

    public exchangedProducts?: WorkOrderResultItem[],
    public addedProducts?: WorkOrderResultItem[],
    public removedProducts?: WorkOrderResultItem[]
  ) {
    this.calculateTotalValue()
  }

  getExchangedAndAddedProducts(): WorkOrderResultItem[] {
    return [...(this.exchangedProducts ?? []), ...(this.addedProducts ?? [])]
  }

  private getProductsArray(
    type: WorkOrderResultItemType
  ): WorkOrderResultItem[] {
    switch (type) {
      case WorkOrderResultItemType.ADDED:
        if (!this.addedProducts) this.addedProducts = []
        return this.addedProducts
      case WorkOrderResultItemType.REMOVED:
        if (!this.removedProducts) this.removedProducts = []
        return this.removedProducts
      case WorkOrderResultItemType.EXCHANGED:
        if (!this.exchangedProducts) this.exchangedProducts = []
        return this.exchangedProducts
      default:
        throw new Error('Tipo inválido')
    }
  }

  private setProductsArray(
    type: WorkOrderResultItemType,
    arr: WorkOrderResultItem[]
  ) {
    switch (type) {
      case WorkOrderResultItemType.ADDED:
        this.addedProducts = arr
        break
      case WorkOrderResultItemType.REMOVED:
        this.removedProducts = arr
        break
      case WorkOrderResultItemType.EXCHANGED:
        this.exchangedProducts = arr
        break
    }
  }

  private addProduct(
    type: WorkOrderResultItemType,
    product: Product,
    quantity: number
  ): void {
    const snapshot = ProductSnapshot.fromDTO({
      productId: product.id,
      productName: product.name,
      salePrice: product.salePrice,
    })
    const item = WorkOrderResultItem.fromProductSnapshot(
      this.id,
      snapshot,
      this.id,
      quantity,
      type,
      product.salePrice
    )
    let arr = this.getProductsArray(type)
    const existing = arr.find((p) => p.productId === item.productId)
    if (existing) {
      existing.quantity += quantity
    } else {
      arr.push(item)
    }
    this.setProductsArray(type, arr)
  }

  private removeProduct(
    type: WorkOrderResultItemType,
    product: Product,
    quantity: number
  ): void {
    let arr = this.getProductsArray(type)
    const item = arr.find((p) => p.productId === product.id)
    if (!item) {
      throw new Error('Produto não encontrado na lista.')
    }
    item.quantity -= quantity
    if (item.quantity <= 0) {
      arr = arr.filter((p) => p.productId !== product.id)
    }
    this.setProductsArray(type, arr)
  }

  addAddedProduct(product: Product, quantity: number): void {
    this.addProduct(WorkOrderResultItemType.ADDED, product, quantity)
    this.calculateTotalValue()
  }
  removeAddedProduct(product: Product, quantity: number): void {
    this.removeProduct(WorkOrderResultItemType.ADDED, product, quantity)
    this.calculateTotalValue()
  }
  addRemovedProduct(product: Product, quantity: number): void {
    this.addProduct(WorkOrderResultItemType.REMOVED, product, quantity)
    this.calculateTotalValue()
  }
  removeRemovedProduct(product: Product, quantity: number): void {
    this.removeProduct(WorkOrderResultItemType.REMOVED, product, quantity)
    this.calculateTotalValue()
  }
  addExchangedProduct(product: Product, quantity: number): void {
    this.addProduct(WorkOrderResultItemType.EXCHANGED, product, quantity)
    this.calculateTotalValue()
  }
  removeExchangedProduct(product: Product, quantity: number): void {
    this.removeProduct(WorkOrderResultItemType.EXCHANGED, product, quantity)
    this.calculateTotalValue()
  }

  calculateTotalValue(): void {
    this.totalValue = 0
    const allItems = [
      ...(this.exchangedProducts ?? []),
      ...(this.addedProducts ?? []),
    ]
    this.totalValue = allItems.reduce(
      (acc, item) => acc + item.priceSnapshot * item.quantity,
      0
    )
  }

  toDTO(): WorkOrderResultSerializableDTO {
    return {
      id: this.id,
      totalValue: this.totalValue,
      items: [
        ...(this.exchangedProducts?.map((p) => p.toDTO()) ?? []),
        ...(this.addedProducts?.map((p) => p.toDTO()) ?? []),
        ...(this.removedProducts?.map((p) => p.toDTO()) ?? []),
      ],
    }
  }

  static fromDTO(dto: WorkOrderResultSerializableDTO): WorkOrderResult {
    const exchangedProducts =
      dto.items &&
      dto.items
        .filter((item) => item.type === WorkOrderResultItemType.EXCHANGED)
        .map((item) => WorkOrderResultItem.fromDTO(item))

    const addedProducts =
      dto.items &&
      dto.items
        .filter((item) => item.type === WorkOrderResultItemType.ADDED)
        .map((item) => WorkOrderResultItem.fromDTO(item))

    const removedProducts =
      dto.items &&
      dto.items
        .filter((item) => item.type === WorkOrderResultItemType.REMOVED)
        .map((item) => WorkOrderResultItem.fromDTO(item))
    return new WorkOrderResult(
      dto.id,
      dto.totalValue,
      exchangedProducts,
      addedProducts,
      removedProducts
    )
  }
}
