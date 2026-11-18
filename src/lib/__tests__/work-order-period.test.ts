import {
  describeScheduledPeriod,
  monthKey,
  monthLabel,
  parseDay,
  resolveScheduledRange,
  toDayString,
} from '@/src/lib/work-order-period'
import { describe, expect, it } from 'vitest'

const NOW = new Date(2026, 10, 18, 15, 30) // 18 Nov 2026, local

describe('resolveScheduledRange', () => {
  it('returns undefined without period params', () => {
    expect(resolveScheduledRange({}, NOW)).toBeUndefined()
  })

  it('resolves presets relative to now', () => {
    expect(resolveScheduledRange({ scheduledPeriod: 'today' }, NOW)).toEqual({
      from: new Date(2026, 10, 18, 0, 0, 0, 0),
      to: new Date(2026, 10, 18, 23, 59, 59, 999),
    })
    expect(
      resolveScheduledRange({ scheduledPeriod: 'this-month' }, NOW)
    ).toEqual({
      from: new Date(2026, 10, 1),
      to: new Date(2026, 10, 30, 23, 59, 59, 999),
    })
    expect(
      resolveScheduledRange({ scheduledPeriod: 'last-month' }, NOW)
    ).toEqual({
      from: new Date(2026, 9, 1),
      to: new Date(2026, 9, 31, 23, 59, 59, 999),
    })
    expect(
      resolveScheduledRange({ scheduledPeriod: 'last-3-months' }, NOW)
    ).toEqual({
      from: new Date(2026, 8, 1),
      to: new Date(2026, 10, 30, 23, 59, 59, 999),
    })
  })

  it('crosses the year boundary', () => {
    const jan = new Date(2027, 0, 10)
    expect(
      resolveScheduledRange({ scheduledPeriod: 'last-month' }, jan)
    ).toEqual({
      from: new Date(2026, 11, 1),
      to: new Date(2026, 11, 31, 23, 59, 59, 999),
    })
  })

  it('custom ranges are inclusive whole days, either end optional', () => {
    expect(
      resolveScheduledRange(
        { scheduledFrom: '2026-09-01', scheduledTo: '2026-10-31' },
        NOW
      )
    ).toEqual({
      from: new Date(2026, 8, 1),
      to: new Date(2026, 9, 31, 23, 59, 59, 999),
    })
    expect(
      resolveScheduledRange({ scheduledFrom: '2026-09-01' }, NOW)
    ).toEqual({ from: new Date(2026, 8, 1), to: undefined })
  })

  it('keeps the legacy single-day filter working', () => {
    expect(resolveScheduledRange({ scheduledDate: 'today' }, NOW)?.from).toEqual(
      new Date(2026, 10, 18)
    )
    const iso = new Date(2026, 9, 5, 12).toISOString()
    expect(resolveScheduledRange({ scheduledDate: iso }, NOW)).toEqual({
      from: new Date(2026, 9, 5),
      to: new Date(2026, 9, 5, 23, 59, 59, 999),
    })
  })
})

describe('labels', () => {
  it('describes presets and custom ranges', () => {
    expect(describeScheduledPeriod({ scheduledPeriod: 'this-month' })).toBe(
      'Este mês'
    )
    expect(
      describeScheduledPeriod({
        scheduledFrom: '2026-09-01',
        scheduledTo: '2026-10-31',
      })
    ).toBe('01/09/2026 a 31/10/2026')
    expect(describeScheduledPeriod({ scheduledTo: '2026-10-31' })).toBe(
      'Até 31/10/2026'
    )
    expect(describeScheduledPeriod({ scheduledDate: 'today' })).toBe('Hoje')
  })

  it('formats months and days', () => {
    expect(monthKey(new Date(2026, 9, 31, 23))).toBe('2026-10')
    expect(monthLabel('2026-10')).toBe('Outubro 2026')
    expect(toDayString(parseDay('2026-03-07')!)).toBe('2026-03-07')
  })
})
