import { License } from '@/src/domain/entities/license/license.entity'
import { UUID } from '@/src/lib/utils'

export interface LicenseRepository {
  getLicense(): Promise<License | null>
  createLicense(
    uniqueCode: string,
    expirationDate: Date,
    isAdmin: boolean
  ): Promise<License>
  updateLicense(
    id: UUID,
    expirationDate: Date,
    isAdmin?: boolean
  ): Promise<void>
  deleteLicense(): Promise<void>
}
