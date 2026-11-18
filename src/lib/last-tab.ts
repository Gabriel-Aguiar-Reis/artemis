import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Remembers the last bottom tab the user was on, so a cold start reopens it
 * (not only when the app was kept in background). Defaults to the itinerary,
 * the app's main screen.
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

let current: TabName = DEFAULT_TAB

const isTab = (value: unknown): value is TabName =>
  typeof value === 'string' && (TABS as readonly string[]).includes(value)

/** Reads the saved tab once during boot (before the splash is hidden). */
export async function loadLastTab(): Promise<TabName> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY)
    if (isTab(saved)) current = saved
  } catch {
    // storage unavailable: keep the default
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
