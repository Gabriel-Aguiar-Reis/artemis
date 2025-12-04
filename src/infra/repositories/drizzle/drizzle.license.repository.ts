import { License } from '@/src/domain/entities/license/license.entity'
import { LicenseRepository } from '@/src/domain/repositories/license/license.repository'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { license } from '@/src/infra/db/drizzle/schema/drizzle.license.schema'
import { UUID } from '@/src/lib/utils'
import { eq } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzleLicenseRepository implements LicenseRepository {
  async getLicense(): Promise<License | null> {
    const rows = await db.select().from(license).limit(1)
    if (rows.length === 0) {
      return null
    }
    const row = rows[0]
    return new License(
      row.id as UUID,
      row.uniqueCode,
      new Date(row.expirationDate),
      row.isAdmin,
      new Date(row.createdAt)
    )
  }

  async createLicense(
    uniqueCode: string,
    expirationDate: Date,
    isAdmin: boolean
  ): Promise<License> {
    const id = String(uuid.v4()) as UUID
    const createdAt = new Date()

    await db.insert(license).values({
      id,
      uniqueCode,
      expirationDate: expirationDate.toISOString().split('T')[0],
      isAdmin,
      createdAt: createdAt.toISOString(),
    })

    return new License(id, uniqueCode, expirationDate, isAdmin, createdAt)
  }

  async updateLicense(
    id: UUID,
    expirationDate: Date,
    isAdmin?: boolean
  ): Promise<void> {
    const updateData: any = {
      expirationDate: expirationDate.toISOString().split('T')[0],
    }

    if (isAdmin !== undefined) {
      updateData.isAdmin = isAdmin
    }

    await db.update(license).set(updateData).where(eq(license.id, id))
  }

  async deleteLicense(): Promise<void> {
    await db.delete(license)
  }
}
