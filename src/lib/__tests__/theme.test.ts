import { describe, expect, it, vi } from 'vitest'

const navThemeMock = vi.hoisted(() => ({
  DefaultTheme: {
    dark: false,
    colors: {
      background: '#fff',
      border: '#eee',
      card: '#fff',
      notification: '#f00',
      primary: '#111',
      text: '#000',
    },
  },
  DarkTheme: {
    dark: true,
    colors: {
      background: '#000',
      border: '#111',
      card: '#000',
      notification: '#0f0',
      primary: '#fff',
      text: '#fff',
    },
  },
}))

vi.mock('@react-navigation/native', () => navThemeMock)

async function loadTheme() {
  return import('@/src/lib/theme')
}

const expectColorKeys = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'popover',
  'popoverForeground',
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'muted',
  'mutedForeground',
  'accent',
  'accentForeground',
  'destructive',
  'warning',
  'warningForeground',
  'border',
  'input',
  'ring',
  'radius',
  'chart1',
  'chart2',
  'chart3',
  'chart4',
  'chart5',
] as const

describe('theme constants', () => {
  it('defines all color tokens for both schemes', async () => {
    const { THEME } = await loadTheme()
    for (const scheme of ['light', 'dark'] as const) {
      for (const key of expectColorKeys) {
        expect(THEME[scheme][key]).toBeTruthy()
      }
    }
  })

  it('merges navigation themes with palette', () => {
    return loadTheme().then(({ NAV_THEME, THEME }) => {
      expect(NAV_THEME.light.colors?.background).toBe(THEME.light.background)
      expect(NAV_THEME.light.colors?.primary).toBe(THEME.light.primary)
      expect(NAV_THEME.dark.colors?.background).toBe(THEME.dark.background)
      expect(NAV_THEME.dark.colors?.primary).toBe(THEME.dark.primary)
    })
  })

  it('preserves navigation flags and notification colors', async () => {
    const { NAV_THEME, THEME } = await loadTheme()
    expect(NAV_THEME.light.dark).toBe(false)
    expect(NAV_THEME.dark.dark).toBe(true)
    expect(NAV_THEME.light.colors?.notification).toBe(THEME.light.destructive)
    expect(NAV_THEME.dark.colors?.notification).toBe(THEME.dark.destructive)
  })
})
