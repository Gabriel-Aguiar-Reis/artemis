import { Category } from '@/src/domain/entities/category/category.entity'
import {
  CategoryInsertDTO,
  CategoryUpdateDTO,
} from '@/src/domain/validations/category.schema'
import { UUID } from 'crypto'

export abstract class CategoryRepository {
  abstract getCategories: () => Promise<Category[]>
  abstract addCategory: (dto: CategoryInsertDTO) => Promise<void>
  abstract updateCategory: (dto: CategoryUpdateDTO) => Promise<void>
  abstract deleteCategory: (id: UUID) => Promise<void>
  abstract getCategory: (id: UUID) => Promise<Category | null>
  abstract getActiveCategories: () => Promise<Category[]>
  abstract updateDisableCategory: (id: UUID) => Promise<void>
}
