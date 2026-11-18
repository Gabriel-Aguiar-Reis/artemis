import { License } from '@/src/domain/entities/license/license.entity'
import DrizzleLicenseRepository from '@/src/infra/repositories/drizzle/drizzle.license.repository'
import {
  generateUniqueCode,
  validateLicenseCode,
} from '@/src/lib/license-crypto'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const licenseRepository = new DrizzleLicenseRepository()

const LICENSE_QUERY_KEY = ['license']

/**
 * Hook to get the current license
 */
export function useLicense() {
  return useQuery({
    queryKey: LICENSE_QUERY_KEY,
    queryFn: async () => {
      return await licenseRepository.getLicense()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to create the initial license
 */
export function useCreateInitialLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const uniqueCode = generateUniqueCode()
      const expirationDate = new Date() // Expired since the start
      const isAdmin = false

      return await licenseRepository.createLicense(
        uniqueCode,
        expirationDate,
        isAdmin
      )
    },
    onSuccess: () => {
      // Invalidate the cache to force an immediate refetch
      queryClient.invalidateQueries({ queryKey: LICENSE_QUERY_KEY })
    },
  })
}

/**
 * Hook to validate and update the license with a code
 */
export function useActivateLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      inputCode,
      license,
    }: {
      inputCode: string
      license: License
    }) => {
      const validation = await validateLicenseCode(
        inputCode,
        license.uniqueCode,
        license.expirationDate
      )

      if (!validation.valid || !validation.newExpirationDate) {
        throw new Error('Código de licença inválido')
      }

      await licenseRepository.updateLicense(
        license.id,
        validation.newExpirationDate,
        validation.isAdmin
      )

      return validation
    },
    onSuccess: () => {
      // Invalidate the cache to update the license
      queryClient.invalidateQueries({ queryKey: LICENSE_QUERY_KEY })
    },
  })
}

/**
 * Hook to renew the license in advance
 */
export function useRenewLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      inputCode,
      license,
    }: {
      inputCode: string
      license: License
    }) => {
      const validation = await validateLicenseCode(
        inputCode,
        license.uniqueCode,
        license.expirationDate
      )

      if (!validation.valid || !validation.newExpirationDate) {
        throw new Error('Código de licença inválido')
      }

      await licenseRepository.updateLicense(
        license.id,
        validation.newExpirationDate
      )

      return validation
    },
    onSuccess: () => {
      // Invalidate the cache to update the license
      queryClient.invalidateQueries({ queryKey: LICENSE_QUERY_KEY })
    },
  })
}
