import { Category } from '@/src/domain/entities/category/category.entity'
import { CategoryTable } from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import { UUID } from '@/src/lib/utils'

export class CategoryMapper {
  static toDomain(table: CategoryTable): Category {
    return Category.fromDTO({
      id: table.id as UUID,
      name: table.name,
      isActive: table.isActive,
    })
  }

  static toPersistence(entity: Category): CategoryTable {
    return {
      id: entity.id,
      name: entity.name,
      isActive: entity.isActive,
    }
  }
}
