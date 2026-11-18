import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Navigation state that survives a cold start (not only background): the last
 * bottom tab the user was on (default: itinerary, the app's main screen) and
 * the filters applied on each tab's list.
 */

export const TABS = [
  'customers',
  'products',
  'itinerary',
  'work-orders',
  'categories',
] as const

export type TabName = (typeof TABS)[number]

export const DEFAULT_TAB: TabName = 'itinerary'

const STORAGE_KEY = 'last-tab'
const FILTERS_KEY = 'tab-filters'

let current: TabName = DEFAULT_TAB

export type TabFilters = Record<string, string>
let filters: Partial<Record<TabName, TabFilters>> = {}

const isTab = (value: unknown): value is TabName =>
  typeof value === 'string' && (TABS as readonly string[]).includes(value)

/**
 * Reads the saved tab and filters once during boot (before the splash is
 * hidden), so restoring them is synchronous.
 */
export async function loadLastTab(): Promise<TabName> {
  try {
    const [saved, savedFilters] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(FILTERS_KEY),
    ])
    if (isTab(saved)) current = saved
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters)
      if (parsed && typeof parsed === 'object') filters = parsed
    }
  } catch {
    // storage unavailable or corrupted: keep the defaults
  }
  return current
}

/** Synchronous access for the initial redirect. */
export function getLastTab(): TabName {
  return current
}

export function saveLastTab(tab: string): void {
  if (!isTab(tab) || tab === current) return
  current = tab
  AsyncStorage.setItem(STORAGE_KEY, tab).catch(() => {})
}

/** Filters saved for a tab's list (empty object when none). */
export function getTabFilters(tab: TabName): TabFilters {
  return filters[tab] ?? {}
}

export function saveTabFilters(tab: TabName, value: TabFilters): void {
  const prev = filters[tab] ?? {}
  if (JSON.stringify(prev) === JSON.stringify(value)) return
  filters = { ...filters, [tab]: value }
  AsyncStorage.setItem(FILTERS_KEY, JSON.stringify(filters)).catch(() => {})
}
