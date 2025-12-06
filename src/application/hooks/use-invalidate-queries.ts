import {
  getQueryKeysToInvalidate,
  QueryKey,
} from '@/src/application/hooks/query-invalidation.config'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Hook para invalidar queries manualmente quando necessário
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateQueries()
 *
 * // Invalida customers e todas suas dependências (workOrders, itineraries, etc)
 * invalidate('customers')
 *
 * // Invalida múltiplas queries
 * invalidate(['customers', 'products'])
 * ```
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient()

  return (keys: QueryKey | QueryKey[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys]
    const allKeysToInvalidate = new Set<QueryKey>()

    keysArray.forEach((key) => {
      const dependentKeys = getQueryKeysToInvalidate(key)
      dependentKeys.forEach((k) => allKeysToInvalidate.add(k))
    })

    Array.from(allKeysToInvalidate).forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    })
  }
}

/**
 * Hook para invalidar queries específicas (sem dependências)
 * Use apenas quando tiver certeza de que não precisa invalidar dependências
 *
 * @example
 * ```tsx
 * const invalidateExact = useInvalidateQueriesExact()
 *
 * // Invalida apenas customers (sem dependências)
 * invalidateExact('customers')
 * ```
 */
export function useInvalidateQueriesExact() {
  const queryClient = useQueryClient()

  return (keys: QueryKey | QueryKey[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys]

    keysArray.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    })
  }
}
