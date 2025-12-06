import { Product } from '@/src/domain/entities/product/product.entity'
import { ProductWithCategoryDTO } from '@/src/domain/repositories/product/dtos/product-with-category.dto'
import {
  ProductInsertDTO,
  ProductUpdateDTO,
} from '@/src/domain/validations/product.schema'
import { UUID } from '@/src/lib/utils'

export abstract class ProductRepository {
  abstract getProducts: () => Promise<Product[]>
  abstract addProduct: (dto: ProductInsertDTO) => Promise<void>
  abstract updateProduct: (dto: ProductUpdateDTO) => Promise<void>
  abstract deleteProduct: (id: UUID) => Promise<void>
  abstract getProduct: (id: UUID) => Promise<Product | null>
  abstract getActiveProducts: () => Promise<Product[]>
  abstract getProductsByCategory: (categoryId: UUID) => Promise<Product[]>
  abstract getProductsWithCategory: () => Promise<ProductWithCategoryDTO[]>
  abstract updateDisableProduct: (id: UUID) => Promise<void>
}
