import {
  getTabFilters,
  saveTabFilters,
  TabFilters,
  TabName,
} from '@/src/lib/last-tab'
import { useNavigation } from 'expo-router'
import { useEffect } from 'react'

/** Route params that are one-off signals, not filters */
const TRANSIENT_PARAMS = new Set(['createdWorkOrderId'])

/** Tabs whose saved filters were already considered in this app session */
const restored = new Set<TabName>()

function toFilters(params: Record<string, unknown>): TabFilters {
  const out: TabFilters = {}
  for (const [key, value] of Object.entries(params)) {
    if (TRANSIENT_PARAMS.has(key)) continue
    if (typeof value === 'string' && value !== '') out[key] = value
  }
  return out
}

/**
 * Keeps a tab list's filters (its route params) across cold starts.
 *
 * The first time the tab's list mounts in a session, if it has no filters and
 * some were saved, they are restored. From then on every change is saved, so
 * clearing the filters also persists.
 */
export function usePersistedTabFilters(
  tab: TabName,
  params: Record<string, unknown>
): void {
  // The screen's own navigation object: router.setParams would target the
  // focused route, which on a cold start is still the initial redirect
  const navigation = useNavigation()
  const current = toFilters(params)
  const key = JSON.stringify(current)

  useEffect(() => {
    if (!restored.has(tab)) {
      restored.add(tab)
      const saved = getTabFilters(tab)
      if (Object.keys(current).length === 0 && Object.keys(saved).length > 0) {
        navigation.setParams(saved as never)
        return
      }
    }
    saveTabFilters(tab, current)
    // `key` captures the filter values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, key])
}

/** Test helper: forget which tabs were restored in this session. */
export function __resetRestoredTabs(): void {
  restored.clear()
}
