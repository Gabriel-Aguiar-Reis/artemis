import { describe, expect, it } from 'vitest'
import {
  customerDedupeKeys,
  dataRows,
  normalizePhoneDigits,
  normalizePrice,
  normalizeZip,
  parseBool,
  validateCategoryRow,
  validateCustomerRow,
  validateProductRow,
} from '../xlsx-import'

describe('xlsx import normalizers', () => {
  it('normalizes prices in BR and plain formats', () => {
    expect(normalizePrice('10,50')).toBe(10.5)
    expect(normalizePrice('R$ 10')).toBe(10)
    expect(normalizePrice('R$ 1.234,56')).toBe(1234.56)
    expect(normalizePrice('10.5')).toBe(10.5)
    expect(normalizePrice(7.999)).toBe(8)
    expect(normalizePrice('abc')).toBeNull()
    expect(normalizePrice(-1)).toBeNull()
  })

  it('keeps leading zero in zip codes and pads numeric cells', () => {
    expect(normalizeZip('01234-567')).toBe('01234567')
    expect(normalizeZip(1234567)).toBe('01234567')
    expect(normalizeZip('')).toBe('')
  })

  it('keeps only digits in phones and strips country code', () => {
    expect(normalizePhoneDigits('+55 (11) 98765-4321')).toBe('11987654321')
    expect(normalizePhoneDigits(1198765432)).toBe('1198765432')
  })

  it('parses booleans', () => {
    expect(parseBool(1)).toBe(true)
    expect(parseBool('0')).toBe(false)
    expect(parseBool('Sim')).toBe(true)
    expect(parseBool('', true)).toBe(true)
  })

  it('skips header and empty rows, keeping sheet line numbers', () => {
    const rows = dataRows([['h'], ['a'], ['', ''], ['b']])
    expect(rows.map((r) => r.line)).toEqual([2, 4])
  })
})

describe('xlsx import validation', () => {
  it('validates categories', () => {
    expect(validateCategoryRow(['Bebidas', 1], 2).ok).toBe(true)
    const bad = validateCategoryRow(['A', 1], 3)
    expect(bad.ok).toBe(false)
  })

  it('validates products and normalizes price and expiration', () => {
    const v = validateProductRow(['Suco', 'Bebidas', 'R$ 3,5', 1, '1 mês'], 2)
    expect(v.ok).toBe(true)
    if (v.ok) {
      expect(v.value.salePrice).toBe(3.5)
      expect(v.value.expiration).toBe('1 mês')
    }
    expect(validateProductRow(['Suco', '', 3, 1, '10 dias'], 2).ok).toBe(false)
    expect(validateProductRow(['Suco', 'B', 'x', 1, '10 dias'], 2).ok).toBe(
      false
    )
    expect(validateProductRow(['Suco', 'B', 3, 1, 'xx'], 2).ok).toBe(false)
  })

  it('validates customers with digits-only phone and zero-padded zip', () => {
    const v = validateCustomerRow(
      [
        'Loja Centro',
        'Maria',
        '(11) 98765-4321',
        1,
        '',
        0,
        'Rua A',
        '10',
        'Centro',
        'Taubaté',
        1234567,
      ],
      2
    )
    expect(v.ok).toBe(true)
    if (v.ok) {
      expect(v.value.phoneNumber).toBe('11987654321')
      expect(v.value.addressZipCode).toBe('01234567')
      expect(v.value.landlineNumber).toBeNull()
    }
    const bad = validateCustomerRow(
      ['L', 'M', '', 0, '', 0, 'R', '1', 'B', 'C', ''],
      3
    )
    expect(bad.ok).toBe(false)
  })

  it('builds dedupe keys ignoring accent and case', () => {
    const a = customerDedupeKeys({
      storeName: 'Padaria São José',
      phoneNumber: '11987654321',
      addressZipCode: '01234567',
      addressStreetNumber: '10',
    })
    const b = customerDedupeKeys({
      storeName: 'padaria sao jose',
      phoneNumber: '11987654321',
      addressZipCode: '99999999',
      addressStreetNumber: '1',
    })
    expect(a.some((k) => b.includes(k))).toBe(true)
  })
})
