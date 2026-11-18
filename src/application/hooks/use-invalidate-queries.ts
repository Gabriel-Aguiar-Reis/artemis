import {
  getQueryKeysToInvalidate,
  QueryKey,
} from '@/src/application/hooks/query-invalidation.config'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Hook to manually invalidate queries when needed
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateQueries()
 *
 * // Invalidates customers and all their dependencies (workOrders, itineraries, etc)
 * invalidate('customers')
 *
 * // Invalidates multiple queries
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
      queryClient.invalidateQueries({
        queryKey: [queryKey],
        refetchType: 'active',
      })
    })
  }
}

/**
 * Hook to invalidate specific queries (without dependencies)
 * Use only when you are sure dependencies do not need invalidating
 *
 * @example
 * ```tsx
 * const invalidateExact = useInvalidateQueriesExact()
 *
 * // Invalidates only customers (without dependencies)
 * invalidateExact('customers')
 * ```
 */
export function useInvalidateQueriesExact() {
  const queryClient = useQueryClient()

  return (keys: QueryKey | QueryKey[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys]

    keysArray.forEach((queryKey) => {
      queryClient.invalidateQueries({
        queryKey: [queryKey],
        refetchType: 'active',
      })
    })
  }
}
