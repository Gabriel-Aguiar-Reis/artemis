import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('libphonenumber-js', async () => {
  const actual =
    await vi.importActual<typeof import('libphonenumber-js')>(
      'libphonenumber-js'
    )
  return {
    ...actual,
    parsePhoneNumberFromString: vi.fn(actual.parsePhoneNumberFromString),
  }
})

import {
  cn,
  formatPhoneBrazil,
  getErrorMessage,
  normalizePhoneBrazil,
  PERIODS,
  smartSearch,
} from '@/src/lib/utils'
import * as libPhone from 'libphonenumber-js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('utils', () => {
  describe('cn', () => {
    it('should combine classes correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
    })

    it('should handle conditional values', () => {
      expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
    })

    it('should handle arrays', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2')
    })
  })

  describe('smartSearch', () => {
    it('should find exact text', () => {
      expect(smartSearch('Hello World', 'hello')).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(smartSearch('HELLO', 'hello')).toBe(true)
      expect(smartSearch('hello', 'HELLO')).toBe(true)
    })

    it('should normalize accents', () => {
      expect(smartSearch('São Paulo', 'sao paulo')).toBe(true)
      expect(smartSearch('Programação', 'programacao')).toBe(true)
    })

    it('should return false when not found', () => {
      expect(smartSearch('Hello', 'world')).toBe(false)
    })

    it('should handle empty strings', () => {
      expect(smartSearch('', '')).toBe(true)
      expect(smartSearch('texto', '')).toBe(true)
      expect(smartSearch('', 'texto')).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('should return undefined for falsy values', () => {
      expect(getErrorMessage(null)).toBeUndefined()
      expect(getErrorMessage(undefined)).toBeUndefined()
      expect(getErrorMessage(0)).toBeUndefined()
      expect(getErrorMessage('')).toBeUndefined()
    })

    it('should return the string directly', () => {
      expect(getErrorMessage('Custom error')).toBe('Custom error')
    })

    it('should extract message from an Error object', () => {
      const error = new Error('Error message')
      expect(getErrorMessage(error)).toBe('Error message')
    })

    it('should extract message from a generic object', () => {
      const error = { message: 'Custom error' }
      expect(getErrorMessage(error)).toBe('Custom error')
    })

    it('should return undefined if message is not a string', () => {
      const error = { message: 123 }
      expect(getErrorMessage(error)).toBeUndefined()
    })

    it('should return undefined for objects without message', () => {
      const error = { code: 500 }
      expect(getErrorMessage(error)).toBeUndefined()
    })
  })

  describe('formatPhoneBrazil', () => {
    it('should format valid mobile phone number', () => {
      const result = formatPhoneBrazil('+5511999887766')
      expect(result).toBe('(11) 99988-7766')
    })

    it('should format valid landline phone number', () => {
      const result = formatPhoneBrazil('+551133334444')
      expect(result).toBe('(11) 3333-4444')
    })

    it('should return empty string for undefined', () => {
      expect(formatPhoneBrazil(undefined)).toBe('')
    })

    it('should return the original value for invalid number', () => {
      const invalid = '123'
      expect(formatPhoneBrazil(invalid)).toBe(invalid)
    })

    it('should return the original value when parsed number is invalid', () => {
      const invalid = '+5511999887766'
      const parser = vi.mocked(libPhone.parsePhoneNumberFromString)
      parser.mockReturnValueOnce({
        isValid: () => false,
        formatNational: vi.fn(),
      } as any)

      expect(formatPhoneBrazil(invalid)).toBe(invalid)
      expect(parser).toHaveBeenCalledWith(invalid, 'BR')
    })

    it('should return the original value in case of error', () => {
      const invalid = 'not-a-phone'
      const result = formatPhoneBrazil(invalid)
      expect(result).toBe(invalid)
    })

    it('should return original value when parser throws', () => {
      const parser = vi.mocked(libPhone.parsePhoneNumberFromString)
      parser.mockImplementationOnce(() => {
        throw new Error('parser failure')
      })

      const result = formatPhoneBrazil('+5511999887766')
      expect(result).toBe('+5511999887766')
      expect(parser).toHaveBeenCalledWith('+5511999887766', 'BR')
    })

    it('should return empty string when raw is empty', () => {
      expect(formatPhoneBrazil('')).toBe('')
    })
  })

  describe('normalizePhoneBrazil', () => {
    it('should remove country code from mobile phone with 55 prefix', () => {
      expect(normalizePhoneBrazil('5511987654321')).toBe('11987654321')
    })

    it('should remove country code from landline phone with 55 prefix', () => {
      expect(normalizePhoneBrazil('551234567890')).toBe('1234567890')
    })

    it('should keep number without country code unchanged', () => {
      expect(normalizePhoneBrazil('11987654321')).toBe('11987654321')
      expect(normalizePhoneBrazil('1234567890')).toBe('1234567890')
    })

    it('should remove formatting characters', () => {
      expect(normalizePhoneBrazil('(11) 98765-4321')).toBe('11987654321')
      expect(normalizePhoneBrazil('+55 11 98765-4321')).toBe('11987654321')
      expect(normalizePhoneBrazil('55 (11) 98765-4321')).toBe('11987654321')
    })

    it('should handle formatted landline numbers', () => {
      expect(normalizePhoneBrazil('(12) 3456-7890')).toBe('1234567890')
      expect(normalizePhoneBrazil('+55 12 3456-7890')).toBe('1234567890')
      expect(normalizePhoneBrazil('55 (12) 3456-7890')).toBe('1234567890')
    })

    it('should return empty string for undefined', () => {
      expect(normalizePhoneBrazil(undefined)).toBe('')
    })

    it('should return empty string for empty string', () => {
      expect(normalizePhoneBrazil('')).toBe('')
    })

    it('should not remove 55 if result would be invalid length', () => {
      // 5512345 tem 7 dígitos, se remover 55 fica com 5 (inválido)
      expect(normalizePhoneBrazil('5512345')).toBe('5512345')
    })

    it('should handle 12-digit numbers starting with 55 as country code + landline', () => {
      // 555678901234 = 12 dígitos → 55 (país) + 5678901234 (10 dígitos de fixo)
      expect(normalizePhoneBrazil('555678901234')).toBe('5678901234')
    })
  })

  describe('PERIODS', () => {
    it('should have 4 defined periods', () => {
      expect(PERIODS).toHaveLength(4)
    })

    it('should have a days period with 31 items', () => {
      const dias = PERIODS.find((p) => p.nome === 'dias')
      expect(dias).toBeDefined()
      expect(dias?.range).toHaveLength(31)
      expect(dias?.range[0]).toBe(1)
      expect(dias?.range[30]).toBe(31)
    })

    it('should have a weeks period with 4 items', () => {
      const semanas = PERIODS.find((p) => p.nome === 'semanas')
      expect(semanas).toBeDefined()
      expect(semanas?.range).toHaveLength(4)
      expect(semanas?.range[0]).toBe(1)
      expect(semanas?.range[3]).toBe(4)
    })

    it('should have a months period with 100 items', () => {
      const meses = PERIODS.find((p) => p.nome === 'meses')
      expect(meses).toBeDefined()
      expect(meses?.range).toHaveLength(100)
      expect(meses?.range[0]).toBe(1)
      expect(meses?.range[99]).toBe(100)
    })

    it('should have a years period with 20 items', () => {
      const anos = PERIODS.find((p) => p.nome === 'anos')
      expect(anos).toBeDefined()
      expect(anos?.range).toHaveLength(20)
      expect(anos?.range[0]).toBe(1)
      expect(anos?.range[19]).toBe(20)
    })
  })
})
