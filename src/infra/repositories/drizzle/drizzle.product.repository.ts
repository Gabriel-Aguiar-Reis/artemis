import { ProductMapper } from '@/src/domain/entities/product/mapper/product.mapper'
import { Product } from '@/src/domain/entities/product/product.entity'
import { Expiration } from '@/src/domain/entities/product/value-objects/expiration.vo'
import { ProductWithCategoryDTO } from '@/src/domain/repositories/product/dtos/product-with-category.dto'
import { ProductRepository } from '@/src/domain/repositories/product/product.repository'
import {
  ProductInsertDTO,
  ProductUpdateDTO,
} from '@/src/domain/validations/product.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { category } from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import { product } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzleProductRepository implements ProductRepository {
  async getProducts(): Promise<Product[]> {
    const rows = await db.select().from(product)
    if (rows.length === 0) {
      return []
    }
    return rows.map(ProductMapper.toDomain)
  }

  async getProductsWithCategory(): Promise<ProductWithCategoryDTO[]> {
    const rows = await db
      .select({
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        salePrice: product.salePrice,
        isActive: product.isActive,
        expiration: product.expiration,
        categoryName: category.name,
      })
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.id))

    return rows.map((row) => ({
      id: row.id as UUID,
      name: row.name,
      categoryId: row.categoryId as UUID,
      salePrice: row.salePrice,
      isActive: row.isActive,
      expiration: row.expiration,
      categoryName: row.categoryName || 'Categoria Desconhecida',
    }))
  }

  async addProduct(dto: ProductInsertDTO): Promise<void> {
    const id = uuid.v4()
    const expiration = new Expiration(dto.expiration)

    const prod = new Product(
      id as UUID,
      dto.name,
      dto.categoryId as UUID,
      dto.salePrice,
      dto.isActive ?? true,
      expiration
    )

    const data = ProductMapper.toPersistence(prod)
    await db.insert(product).values(data).onConflictDoNothing()
  }

  async updateProduct(dto: ProductUpdateDTO): Promise<void> {
    const existing = await this.getProduct(dto.id as UUID)
    if (!existing) throw new Error('O produto não foi encontrado.')

    let expiration = existing.expiration
    dto.expiration && (expiration = new Expiration(dto.expiration))

    const prod = new Product(
      dto.id as UUID,
      dto.name ?? existing.name,
      dto.categoryId as UUID,
      dto.salePrice ?? existing.salePrice,
      dto.isActive ?? existing.isActive,
      expiration
    )

    const data = ProductMapper.toPersistence(prod)

    if (!dto.id)
      throw new Error('O ID do produto é obrigatório para atualização.')

    await db
      .update(product)
      .set(data)
      .where(eq(product.id, dto.id as string))
  }

  async deleteProduct(id: UUID): Promise<void> {
    await db.delete(product).where(eq(product.id, id))
  }

  async getProduct(id: UUID): Promise<Product | null> {
    const [row] = await db.select().from(product).where(eq(product.id, id))

    if (!row) throw new Error('O produto não foi encontrado.')
    return ProductMapper.toDomain(row)
  }

  async getActiveProducts(): Promise<Product[]> {
    const rows = await db
      .select()
      .from(product)
      .where(eq(product.isActive, true))
    return rows.map(ProductMapper.toDomain)
  }

  async getProductsByCategory(categoryId: UUID): Promise<Product[]> {
    const rows = await db
      .select()
      .from(product)
      .where(eq(product.categoryId, categoryId))
    return rows.map(ProductMapper.toDomain)
  }

  async updateDisableProduct(id: UUID): Promise<void> {
    const prod = await this.getProduct(id)
    if (!prod) throw new Error('O produto não foi encontrado.')

    prod.isActive = false
    const data = ProductMapper.toPersistence(prod)

    await db
      .update(product)
      .set({ isActive: data.isActive })
      .where(eq(product.id, id))
  }
}
