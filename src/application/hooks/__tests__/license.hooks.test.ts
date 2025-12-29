import { describe, expect, it, vi } from 'vitest'

describe('license hooks', () => {
  it('covers read, create, activate, and renew flows', async () => {
    const queryCalls: any[] = []
    const mutationCalls: any[] = []
    const invalidateQueries = vi.fn()

    vi.doMock('@tanstack/react-query', () => ({
      useQuery: vi.fn((options) => {
        queryCalls.push(options)
        return { data: undefined, options }
      }),
      useMutation: vi.fn((options) => {
        mutationCalls.push(options)
        return {
          mutateAsync: (args: any) => options.mutationFn(args),
          options,
        }
      }),
      useQueryClient: () => ({ invalidateQueries }),
    }))

    const licenseRepository = {
      getLicense: vi.fn().mockResolvedValue({ id: 'license-1' }),
      createLicense: vi.fn().mockResolvedValue({ id: 'license-1' }),
      updateLicense: vi.fn().mockResolvedValue(undefined),
    }

    vi.doMock(
      '@/src/infra/repositories/drizzle/drizzle.license.repository',
      () => {
        class MockLicenseRepository {
          constructor() {
            Object.assign(this, licenseRepository)
          }
        }

        return {
          __esModule: true,
          default: MockLicenseRepository,
        }
      }
    )

    const generateUniqueCode = vi.fn(() => 'unique-code')
    const validateLicenseCode = vi.fn()

    vi.doMock('@/src/lib/license-crypto', () => ({
      generateUniqueCode,
      validateLicenseCode,
    }))

    const {
      useLicense,
      useCreateInitialLicense,
      useActivateLicense,
      useRenewLicense,
    } = await import('../license.hooks')

    const queryResult = useLicense()
    expect(queryCalls).toHaveLength(1)
    const queryOptions = queryCalls[0]
    expect(queryOptions.queryKey).toEqual(['license'])
    expect(queryOptions.staleTime).toBe(1000 * 60 * 5)
    await queryOptions.queryFn()
    expect(licenseRepository.getLicense).toHaveBeenCalled()
    expect(queryResult).toBeDefined()

    const createHook = useCreateInitialLicense()
    const activateHook = useActivateLicense()
    const renewHook = useRenewLicense()
    expect(createHook).toBeDefined()
    expect(activateHook).toBeDefined()
    expect(renewHook).toBeDefined()

    expect(mutationCalls).toHaveLength(3)
    const [createOptions, activateOptions, renewOptions] = mutationCalls

    const createResult = await createOptions.mutationFn(undefined)
    expect(generateUniqueCode).toHaveBeenCalled()
    expect(licenseRepository.createLicense).toHaveBeenCalledTimes(1)
    const createArgs = licenseRepository.createLicense.mock.calls[0]
    expect(createArgs[0]).toBe('unique-code')
    expect(createArgs[1]).toBeInstanceOf(Date)
    expect(createArgs[2]).toBe(false)
    expect(createResult).toEqual({ id: 'license-1' })
    invalidateQueries.mockClear()
    createOptions.onSuccess?.()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['license'] })

    const license = {
      id: 'license-1',
      uniqueCode: 'abc',
      expirationDate: new Date('2024-01-01T00:00:00Z'),
    } as any

    validateLicenseCode.mockResolvedValueOnce({
      valid: true,
      newExpirationDate: new Date('2025-01-01T00:00:00Z'),
      isAdmin: true,
    })
    const activation = await activateOptions.mutationFn({
      inputCode: 'CODE',
      license,
    })
    expect(validateLicenseCode).toHaveBeenCalledWith(
      'CODE',
      'abc',
      license.expirationDate
    )
    expect(licenseRepository.updateLicense).toHaveBeenCalledWith(
      'license-1',
      new Date('2025-01-01T00:00:00Z'),
      true
    )
    expect(activation).toEqual({
      valid: true,
      newExpirationDate: new Date('2025-01-01T00:00:00Z'),
      isAdmin: true,
    })
    invalidateQueries.mockClear()
    activateOptions.onSuccess?.()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['license'] })

    validateLicenseCode.mockResolvedValueOnce({ valid: false })
    await expect(
      activateOptions.mutationFn({ inputCode: 'BAD', license })
    ).rejects.toThrow('Código de licença inválido')

    validateLicenseCode.mockResolvedValueOnce({
      valid: true,
      newExpirationDate: new Date('2026-01-01T00:00:00Z'),
      isAdmin: false,
    })
    const renewal = await renewOptions.mutationFn({
      inputCode: 'RENEW',
      license,
    })
    expect(validateLicenseCode).toHaveBeenCalledWith(
      'RENEW',
      'abc',
      license.expirationDate
    )
    expect(licenseRepository.updateLicense).toHaveBeenCalledWith(
      'license-1',
      new Date('2026-01-01T00:00:00Z')
    )
    expect(renewal).toEqual({
      valid: true,
      newExpirationDate: new Date('2026-01-01T00:00:00Z'),
      isAdmin: false,
    })
    invalidateQueries.mockClear()
    renewOptions.onSuccess?.()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['license'] })

    validateLicenseCode.mockResolvedValueOnce({ valid: false })
    await expect(
      renewOptions.mutationFn({ inputCode: 'BAD-RENEW', license })
    ).rejects.toThrow('Código de licença inválido')
  })
})
