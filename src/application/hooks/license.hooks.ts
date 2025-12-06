import { License } from '@/src/domain/entities/license/license.entity'
import DrizzleLicenseRepository from '@/src/infra/repositories/drizzle/drizzle.license.repository'
import {
  generateUniqueCode,
  validateLicenseCode,
} from '@/src/lib/license-crypto'
import { useMutation, useQuery } from '@tanstack/react-query'

const licenseRepository = new DrizzleLicenseRepository()

const LICENSE_QUERY_KEY = ['license']

/**
 * Hook para obter a licença atual
 */
export function useLicense() {
  return useQuery({
    queryKey: LICENSE_QUERY_KEY,
    queryFn: async () => {
      return await licenseRepository.getLicense()
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

/**
 * Hook para criar licença inicial
 */
export function useCreateInitialLicense() {
  return useMutation({
    mutationFn: async () => {
      const uniqueCode = generateUniqueCode()
      const expirationDate = new Date() // Expirado desde o início
      const isAdmin = false

      return await licenseRepository.createLicense(
        uniqueCode,
        expirationDate,
        isAdmin
      )
    },
  })
}

/**
 * Hook para validar e atualizar licença com código
 */
export function useActivateLicense() {
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
  })
}

/**
 * Hook para renovar antecipadamente a licença
 */
export function useRenewLicense() {
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
  })
}
