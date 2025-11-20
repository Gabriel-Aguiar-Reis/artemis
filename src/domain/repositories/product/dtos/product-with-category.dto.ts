import { ProductSerializableDTO } from '@/src/domain/entities/product/product.entity'

export type ProductWithCategoryDTO = {
  categoryName: string
} & ProductSerializableDTO
