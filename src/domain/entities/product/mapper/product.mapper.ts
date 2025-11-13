import { Product } from '@/src/domain/entities/product/product.entity'
import { Expiration } from '@/src/domain/entities/product/value-objects/expiration.vo'
import { ProductTable } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import { UUID } from 'crypto'

export class ProductMapper {
  static toDomain(table: ProductTable): Product {
    const expiration = new Expiration(table.expiration)

    return new Product(
      table.id as UUID,
      table.name,
      table.categoryId as UUID,
      table.salePrice,
      table.isActive,
      expiration
    )
  }

  static toPersistence(entity: Product): ProductTable {
    return {
      id: entity.id,
      name: entity.name,
      categoryId: entity.categoryId,
      salePrice: entity.salePrice,
      isActive: entity.isActive,
      expiration: entity.expiration.value,
    }
  }
}
