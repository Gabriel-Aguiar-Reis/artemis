import {
  formatDateForLicense,
  generateLicenseCodeForUser,
  generateLicenseHash,
  generateUniqueCode,
  generateUserActivationCode,
  validateLicenseCode,
} from '@/src/lib/license-crypto'
import * as Crypto from 'expo-crypto'
import uuid from 'react-native-uuid'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  Mock,
  vitest,
} from 'vitest'

vitest.mock('expo-crypto')
vitest.mock('react-native-uuid')

describe('license-crypto', () => {
  beforeEach(() => {
    vitest.clearAllMocks()
  })

  afterEach(() => {
    vitest.useRealTimers()
  })

  describe('generateUniqueCode', () => {
    it('should generate a unique code of 6 uppercase characters', () => {
      ;(uuid.v4 as Mock).mockReturnValue('123e4567-e89b-12d3-a456-426614174000')

      const code = generateUniqueCode()

      expect(code).toBe('123E45')
      expect(code).toHaveLength(6)
      expect(code).toBe(code.toUpperCase())
    })

    it('should remove hyphens from the UUID', () => {
      ;(uuid.v4 as Mock).mockReturnValue('abcd-efgh-ijkl-mnop-qrst')

      const code = generateUniqueCode()

      expect(code).not.toContain('-')
    })
  })

  describe('formatDateForLicense', () => {
    it('should format date in DDMMYY format', () => {
      const date = new Date('2024-12-29')
      const formatted = formatDateForLicense(date)

      expect(formatted).toBe('291224')
    })

    it('should use the current date if none is provided', () => {
      const result = formatDateForLicense()

      expect(result).toMatch(/^\d{6}$/)
      expect(result).toHaveLength(6)
    })

    it('should add leading zero for days less than 10', () => {
      const date = new Date('2024-01-05')
      const formatted = formatDateForLicense(date)

      expect(formatted).toBe('050124')
    })

    it('should add leading zero for months less than 10', () => {
      const date = new Date('2024-03-15')
      const formatted = formatDateForLicense(date)

      expect(formatted).toBe('150324')
    })
  })

  describe('generateUserActivationCode', () => {
    it('should combine unique code and date in CODIGO-DDMMYY format', () => {
      vitest.useFakeTimers()
      vitest.setSystemTime(new Date('2024-12-29T00:00:00Z'))

      const code = generateUserActivationCode('ABC123')

      expect(code).toBe('ABC123-291224')
    })

    it('should keep the code in uppercase', () => {
      vitest.useFakeTimers()
      vitest.setSystemTime(new Date('2024-12-29T00:00:00Z'))

      const code = generateUserActivationCode('XYZ789')

      expect(code).toContain('XYZ789')
    })
  })

  describe('generateLicenseHash', () => {
    it('should generate hash based on unique code and lock date', async () => {
      ;(Crypto.digestStringAsync as Mock).mockResolvedValue(
        'abcdef1234567890abcdef1234567890'
      )

      const hash = await generateLicenseHash('ABC123', '2024-12-29')

      expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
        Crypto.CryptoDigestAlgorithm.SHA256,
        'ABC123-2024-12-29-73616E746F73657874696E746F726573'
      )
      expect(hash).toBe('ABCDEF1234567890')
      expect(hash).toHaveLength(16)
    })

    it('should return hash in uppercase', async () => {
      ;(Crypto.digestStringAsync as Mock).mockResolvedValue(
        'aaaaaabbbbbbccccccdddddd'
      )

      const hash = await generateLicenseHash('TEST', '2024-01-01')

      expect(hash).toBe(hash.toUpperCase())
    })
  })

  describe('validateLicenseCode', () => {
    const ADMIN_PASSWORD = 'sK9!vQ3#nT7@xL2%'

    it('should validate admin password and return lifetime license', async () => {
      const currentExpiration = new Date('2024-12-29')

      const result = await validateLicenseCode(
        ADMIN_PASSWORD,
        'ABC123',
        currentExpiration
      )

      expect(result.valid).toBe(true)
      expect(result.isAdmin).toBe(true)
      expect(result.newExpirationDate).toEqual(new Date('2150-01-01'))
    })

    it('should validate correct license code', async () => {
      const currentExpiration = new Date('2024-12-29')
      const expectedHash = 'VALIDHASH1234567'

      ;(Crypto.digestStringAsync as Mock).mockResolvedValue(
        expectedHash.toLowerCase() + '890'
      )

      const result = await validateLicenseCode(
        expectedHash,
        'ABC123',
        currentExpiration
      )

      expect(result.valid).toBe(true)
      expect(result.isAdmin).toBe(false)
      expect(result.newExpirationDate).not.toBeNull()

      // Deve adicionar 90 dias
      const expectedDate = new Date(currentExpiration)
      expectedDate.setDate(expectedDate.getDate() + 90)
      expect(result.newExpirationDate).toEqual(expectedDate)
    })

    it('should reject invalid license code', async () => {
      const currentExpiration = new Date('2024-12-29')

      ;(Crypto.digestStringAsync as Mock).mockResolvedValue('correcthash123456')

      const result = await validateLicenseCode(
        'WRONGHASH',
        'ABC123',
        currentExpiration
      )

      expect(result.valid).toBe(false)
      expect(result.isAdmin).toBe(false)
      expect(result.newExpirationDate).toBeNull()
    })

    it('should calculate the expiration date correctly (90 days)', async () => {
      const currentExpiration = new Date('2024-01-01')

      ;(Crypto.digestStringAsync as Mock).mockResolvedValue('validhash12345678')

      const result = await validateLicenseCode(
        'VALIDHASH1234567',
        'CODE',
        currentExpiration
      )

      expect(result.valid).toBe(true)

      const expected = new Date('2024-01-01')
      expected.setDate(expected.getDate() + 90)
      expect(result.newExpirationDate).toEqual(expected)
    })
  })

  describe('generateLicenseCodeForUser', () => {
    it('should generate license code from DDMMYY', async () => {
      ;(Crypto.digestStringAsync as Mock).mockResolvedValue(
        'generated1234567890hash'
      )

      const code = await generateLicenseCodeForUser('ABC123', '291224')

      expect(Crypto.digestStringAsync).toHaveBeenCalled()
      expect(code).toBe('GENERATED1234567')
      expect(code).toHaveLength(16)
    })

    it('should correctly convert DDMMYY to YYYY-MM-DD', async () => {
      ;(Crypto.digestStringAsync as Mock).mockResolvedValue(
        'testhash123456789012'
      )

      await generateLicenseCodeForUser('TEST', '150324')

      // Verificar se a data foi convertida corretamente e somada 90 dias
      expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('TEST-2024-06-13-') // 15/03/24 + 90 dias = 13/06/24
      )
    })

    it('should add 90 days to the given date', async () => {
      ;(Crypto.digestStringAsync as Mock).mockResolvedValue(
        'hashcode123456789012'
      )

      await generateLicenseCodeForUser('CODE', '010124') // 01/01/24

      // 01/01/24 + 90 dias = 31/03/24
      expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('2024-03-31')
      )
    })
  })
})
