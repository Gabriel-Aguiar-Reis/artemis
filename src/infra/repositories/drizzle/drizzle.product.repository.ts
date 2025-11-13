import { ProductMapper } from '@/src/domain/entities/product/mapper/product.mapper'
import { Product } from '@/src/domain/entities/product/product.entity'
import { Expiration } from '@/src/domain/entities/product/value-objects/expiration.vo'
import { AddProductDto } from '@/src/domain/repositories/product/dtos/add-product.dto'
import { UpdateProductDto } from '@/src/domain/repositories/product/dtos/update-product.dto'
import { ProductRepository } from '@/src/domain/repositories/product/product.repository'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
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

  async addProduct(dto: AddProductDto): Promise<void> {
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

  async updateProduct(dto: UpdateProductDto): Promise<void> {
    const existing = await this.getProduct(dto.id as UUID)
    if (!existing) {
      throw new Error('Product not found')
    }

    const expiration = new Expiration(dto.expiration)

    const prod = new Product(
      dto.id as UUID,
      dto.name,
      dto.categoryId as UUID,
      dto.salePrice,
      dto.isActive,
      expiration
    )

    const data = ProductMapper.toPersistence(prod)

    await db.update(product).set(data).where(eq(product.id, dto.id))
  }

  async deleteProduct(id: UUID): Promise<void> {
    await db.delete(product).where(eq(product.id, id))
  }

  async getProduct(id: UUID): Promise<Product | null> {
    const [row] = await db.select().from(product).where(eq(product.id, id))

    if (!row) return null
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
    if (!prod) {
      return
    }

    prod.isActive = false
    const data = ProductMapper.toPersistence(prod)

    await db
      .update(product)
      .set({ isActive: data.isActive })
      .where(eq(product.id, id))
  }
}
