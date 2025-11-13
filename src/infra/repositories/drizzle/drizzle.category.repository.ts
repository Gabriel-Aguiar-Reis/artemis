import { Category } from '@/src/domain/entities/category/category.entity'
import { CategoryMapper } from '@/src/domain/entities/category/mapper/category.mapper'
import { CategoryRepository } from '@/src/domain/repositories/category/category.repository'
import { AddCategoryDto } from '@/src/domain/repositories/category/dtos/add-category.dto'
import { UpdateCategoryDto } from '@/src/domain/repositories/category/dtos/update-category.dto'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { category } from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzleCategoryRepository implements CategoryRepository {
  async getCategories(): Promise<Category[]> {
    const rows = await db.select().from(category)
    if (rows.length === 0) {
      return []
    }
    return rows.map(CategoryMapper.toDomain)
  }

  async addCategory(dto: AddCategoryDto): Promise<void> {
    const id = uuid.v4()
    const cat = new Category(id as UUID, dto.name, dto.isActive ?? true)
    const data = CategoryMapper.toPersistence(cat)
    await db.insert(category).values(data).onConflictDoNothing()
  }

  async updateCategory(dto: UpdateCategoryDto): Promise<void> {
    const cat = await this.getCategory(dto.id as UUID)
    if (!cat) {
      throw new Error('Category not found')
    }

    // Criar nova instância para validar através do constructor
    const updated = new Category(dto.id as UUID, dto.name, dto.isActive)
    const data = CategoryMapper.toPersistence(updated)

    await db.update(category).set(data).where(eq(category.id, dto.id))
  }

  async deleteCategory(id: UUID): Promise<void> {
    await db.delete(category).where(eq(category.id, id))
  }

  async getCategory(id: UUID): Promise<Category | null> {
    const [row] = await db.select().from(category).where(eq(category.id, id))

    if (!row) return null
    return CategoryMapper.toDomain(row)
  }

  async getActiveCategories(): Promise<Category[]> {
    const rows = await db
      .select()
      .from(category)
      .where(eq(category.isActive, true))
    return rows.map(CategoryMapper.toDomain)
  }

  async updateDisableCategory(id: UUID): Promise<void> {
    const cat = await this.getCategory(id)
    if (!cat) {
      return
    }

    cat.isActive = false
    const data = CategoryMapper.toPersistence(cat)

    await db
      .update(category)
      .set({ isActive: data.isActive })
      .where(eq(category.id, id))
  }
}
