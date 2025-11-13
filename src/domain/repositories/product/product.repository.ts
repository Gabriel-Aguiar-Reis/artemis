import { Product } from '@/src/domain/entities/product/product.entity'
import { AddProductDto } from '@/src/domain/repositories/product/dtos/add-product.dto'
import { UpdateProductDto } from '@/src/domain/repositories/product/dtos/update-product.dto'
import { UUID } from 'crypto'

export abstract class ProductRepository {
  abstract getProducts: () => Promise<Product[]>
  abstract addProduct: (dto: AddProductDto) => Promise<void>
  abstract updateProduct: (dto: UpdateProductDto) => Promise<void>
  abstract deleteProduct: (id: UUID) => Promise<void>
  abstract getProduct: (id: UUID) => Promise<Product | null>
  abstract getActiveProducts: () => Promise<Product[]>
  abstract getProductsByCategory: (categoryId: UUID) => Promise<Product[]>
  abstract updateDisableProduct: (id: UUID) => Promise<void>
}
