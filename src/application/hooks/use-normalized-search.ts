import { useDebouncedValue } from '@/src/application/hooks/use-debounced-value'
import { normalizeString } from '@/src/lib/utils'
import { useMemo } from 'react'

/**
 * Local accent/case-insensitive search with debounce.
 * Each item's text is normalized ONCE (when the list changes), not on every
 * keystroke.
 */
export function useNormalizedSearch<T>(
  items: T[],
  getText: (item: T) => string,
  query: string,
  delay = 250
): T[] {
  const debounced = useDebouncedValue(query, delay)

  const index = useMemo(
    () =>
      items.map((item) => ({
        item,
        text: normalizeString(getText(item) ?? ''),
      })),
    // getText is a stable inline function per usage; reindexes only when the items change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  )

  return useMemo(() => {
    const needle = normalizeString(debounced.trim())
    if (!needle) return items
    return index.filter((e) => e.text.includes(needle)).map((e) => e.item)
  }, [index, items, debounced])
}
