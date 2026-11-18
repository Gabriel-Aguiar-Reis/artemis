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
  'destructiveForeground',
  'destructiveSubtle',
  'success',
  'successForeground',
  'successSubtle',
  'warning',
  'warningForeground',
  'warningSubtle',
  'info',
  'infoForeground',
  'infoSubtle',
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

  it('matches the CSS variables in global.css (single palette)', async () => {
    const { THEME } = await loadTheme()
    const { readFileSync } = await import('node:fs')
    const path = await import('node:path')
    const css = readFileSync(
      path.resolve(__dirname, '../../../global.css'),
      'utf8'
    )
    const blocks = {
      light: css.slice(css.indexOf(':root {'), css.indexOf('.dark:root')),
      dark: css.slice(css.indexOf('.dark:root')),
    }
    const toCamel = (k: string) =>
      k.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())
    for (const scheme of ['light', 'dark'] as const) {
      const vars = [...blocks[scheme].matchAll(/--([\w-]+):\s*([^;]+);/g)]
      expect(vars.length).toBeGreaterThan(20)
      for (const [, name, value] of vars) {
        const key = toCamel(name) as keyof (typeof THEME)[typeof scheme]
        if (name === 'radius') continue
        expect(THEME[scheme][key], `${scheme} --${name}`).toBe(
          `hsl(${value.trim()})`
        )
      }
    }
  })

  it('dark mode surfaces get lighter with elevation (no pure black)', async () => {
    const { THEME } = await loadTheme()
    const lightness = (hsl: string) =>
      Number(/(\d+(?:\.\d+)?)%\)$/.exec(hsl)![1])
    const d = THEME.dark
    expect(lightness(d.background)).toBeGreaterThan(4)
    expect(lightness(d.card)).toBeGreaterThan(lightness(d.background))
    expect(lightness(d.popover)).toBeGreaterThan(lightness(d.card))
  })
})
