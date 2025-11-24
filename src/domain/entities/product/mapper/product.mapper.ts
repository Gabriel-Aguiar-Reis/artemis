import { Product } from '@/src/domain/entities/product/product.entity'
import { ProductTable } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import { UUID } from 'crypto'

export class ProductMapper {
  static toDomain(table: ProductTable): Product {
    return Product.fromDTO({
      id: table.id as UUID,
      name: table.name,
      categoryId: table.categoryId as UUID,
      salePrice: table.salePrice,
      isActive: table.isActive,
      expiration: table.expiration,
    })
  }

  static toPersistence(entity: Product): ProductTable {
    return {
      id: entity.id,
      name: entity.name,
      categoryId: entity.categoryId,
      salePrice: entity.salePrice,
      isActive: entity.isActive,
      expiration: entity.expiration.toDTO(),
    }
  }
}
