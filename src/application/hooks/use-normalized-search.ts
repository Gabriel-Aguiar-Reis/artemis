import { useDebouncedValue } from '@/src/application/hooks/use-debounced-value'
import { normalizeString } from '@/src/lib/utils'
import { useMemo } from 'react'

/**
 * Busca local acento/caixa-insensível com debounce.
 * O texto de cada item é normalizado UMA vez (quando a lista muda), não a cada
 * tecla digitada.
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
    // getText é uma função inline estável por uso; reindexa só quando os itens mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  )

  return useMemo(() => {
    const needle = normalizeString(debounced.trim())
    if (!needle) return items
    return index.filter((e) => e.text.includes(needle)).map((e) => e.item)
  }, [index, items, debounced])
}
