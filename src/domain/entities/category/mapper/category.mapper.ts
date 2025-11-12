import { Category } from '@/src/domain/models/category/category.model'
import { CategoryTable } from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import { UUID } from 'crypto'

export class CategoryMapper {
  static toDomain(table: CategoryTable): Category {
    return new Category(table.id as UUID, table.name, table.isActive)
  }

  static toPersistence(entity: Category): CategoryTable {
    return {
      id: entity.id,
      name: entity.name,
      isActive: entity.isActive,
    }
  }
}
