import {
  describeNextVisitPeriod,
  isNextVisitView,
  resolveNextVisitRange,
} from '@/src/lib/next-visit-period'
import { describe, expect, it } from 'vitest'

const NOW = new Date(2026, 10, 18, 15, 30) // 18 Nov 2026, local

describe('resolveNextVisitRange', () => {
  it('returns undefined without params', () => {
    expect(resolveNextVisitRange({}, NOW)).toBeUndefined()
    expect(resolveNextVisitRange({ nextVisitPeriod: 'bogus' }, NOW)).toBe(
      undefined
    )
  })

  it('resolves forward-looking presets relative to now', () => {
    expect(
      resolveNextVisitRange({ nextVisitPeriod: 'this-month' }, NOW)
    ).toEqual({
      from: new Date(2026, 10, 1),
      to: new Date(2026, 10, 30, 23, 59, 59, 999),
    })
    expect(
      resolveNextVisitRange({ nextVisitPeriod: 'next-month' }, NOW)
    ).toEqual({
      from: new Date(2026, 11, 1),
      to: new Date(2026, 11, 31, 23, 59, 59, 999),
    })
    expect(
      resolveNextVisitRange({ nextVisitPeriod: 'next-3-months' }, NOW)
    ).toEqual({
      from: new Date(2026, 11, 1),
      to: new Date(2027, 1, 28, 23, 59, 59, 999),
    })
    expect(
      resolveNextVisitRange({ nextVisitPeriod: 'next-year' }, NOW)
    ).toEqual({
      from: new Date(2027, 0, 1),
      to: new Date(2027, 11, 31, 23, 59, 59, 999),
    })
  })

  it('"overdue" is everything before today, with no lower bound', () => {
    expect(resolveNextVisitRange({ nextVisitPeriod: 'overdue' }, NOW)).toEqual({
      to: new Date(2026, 10, 17, 23, 59, 59, 999),
    })
  })

  it('crosses the year boundary', () => {
    const december = new Date(2026, 11, 20)
    expect(
      resolveNextVisitRange({ nextVisitPeriod: 'next-month' }, december)
    ).toEqual({
      from: new Date(2027, 0, 1),
      to: new Date(2027, 0, 31, 23, 59, 59, 999),
    })
  })

  it('resolves a custom range as whole local days', () => {
    expect(
      resolveNextVisitRange(
        { nextVisitFrom: '2027-09-01', nextVisitTo: '2027-09-30' },
        NOW
      )
    ).toEqual({
      from: new Date(2027, 8, 1, 0, 0, 0, 0),
      to: new Date(2027, 8, 30, 23, 59, 59, 999),
    })
  })

  it('a preset wins over a custom range', () => {
    expect(
      resolveNextVisitRange(
        { nextVisitPeriod: 'next-year', nextVisitFrom: '2026-01-01' },
        NOW
      )?.from
    ).toEqual(new Date(2027, 0, 1))
  })
})

describe('describeNextVisitPeriod', () => {
  it('labels presets and ranges', () => {
    expect(describeNextVisitPeriod({ nextVisitPeriod: 'next-year' })).toBe(
      'Ano que vem'
    )
    expect(describeNextVisitPeriod({ nextVisitPeriod: 'overdue' })).toBe(
      'Vencidas'
    )
    expect(
      describeNextVisitPeriod({
        nextVisitFrom: '2027-09-01',
        nextVisitTo: '2027-09-30',
      })
    ).toBe('01/09/2027 a 30/09/2027')
    expect(describeNextVisitPeriod({ nextVisitFrom: '2027-09-01' })).toBe(
      'A partir de 01/09/2027'
    )
    expect(describeNextVisitPeriod({})).toBeUndefined()
  })
})

describe('isNextVisitView', () => {
  it('is an agenda only when filtering for orders that have a reminder', () => {
    expect(isNextVisitView()).toBe(false)
    expect(isNextVisitView({})).toBe(false)
    expect(isNextVisitView({ hasNextVisit: 'false' })).toBe(false)
    expect(isNextVisitView({ hasNextVisit: 'true' })).toBe(true)
    expect(isNextVisitView({ nextVisitFrom: '2027-01-01T00:00:00.000Z' })).toBe(
      true
    )
    expect(isNextVisitView({ nextVisitTo: '2026-11-17T23:59:59.999Z' })).toBe(
      true
    )
  })
})
