import { Category } from '@/src/domain/entities/category/category.entity'
import { CategoryMapper } from '@/src/domain/entities/category/mapper/category.mapper'
import { CategoryRepository } from '@/src/domain/repositories/category/category.repository'
import {
  CategoryInsertDTO,
  CategoryUpdateDTO,
} from '@/src/domain/validations/category.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { category } from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import { UUID } from '@/src/lib/utils'
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

  async addCategory(dto: CategoryInsertDTO): Promise<void> {
    const id = uuid.v4()
    const cat = new Category(id as UUID, dto.name, dto.isActive ?? true)
    const data = CategoryMapper.toPersistence(cat)
    await db.insert(category).values(data).onConflictDoNothing()
  }

  async updateCategory(dto: CategoryUpdateDTO): Promise<void> {
    if (!dto.id)
      throw new Error('O ID da categoria é obrigatório para atualização.')

    const cat = await this.getCategory(dto.id as UUID)
    if (!cat) throw new Error('A categoria não foi encontrada.')

    // Criar nova instância para validar através do constructor
    const updated = new Category(
      cat.id,
      dto.name ?? cat.name,
      dto.isActive ?? cat.isActive
    )
    const data = CategoryMapper.toPersistence(updated)

    await db.update(category).set(data).where(eq(category.id, dto.id))
  }

  async deleteCategory(id: UUID): Promise<void> {
    await db.delete(category).where(eq(category.id, id))
  }

  async getCategory(id: UUID): Promise<Category | null> {
    const row = db
      .select()
      .from(category)
      .where(eq(category.id, id))
      .limit(1)
      .get()

    if (!row) throw new Error('A categoria não foi encontrada.')
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
      throw new Error('A categoria não foi encontrada.')
    }

    cat.isActive = false
    const data = CategoryMapper.toPersistence(cat)

    await db
      .update(category)
      .set({ isActive: data.isActive })
      .where(eq(category.id, id))
  }
}
