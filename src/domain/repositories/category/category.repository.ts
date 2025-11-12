import { Category } from '@/src/domain/entities/category/category.entity'
import { AddCategoryDto } from '@/src/domain/repositories/category/dtos/add-category.dto'
import { UpdateCategoryDto } from '@/src/domain/repositories/category/dtos/update-category.dto'
import { UUID } from 'crypto'

export abstract class CategoryRepository {
  abstract getCategories: () => Promise<Category[]>
  abstract addCategory: (dto: AddCategoryDto) => Promise<void>
  abstract updateCategory: (dto: UpdateCategoryDto) => Promise<void>
  abstract deleteCategory: (id: UUID) => Promise<void>
  abstract getCategory: (id: UUID) => Promise<Category | undefined>
  abstract getActiveCategories: () => Promise<Category[]>
  abstract updateDisableCategory: (id: UUID) => Promise<void>
}
