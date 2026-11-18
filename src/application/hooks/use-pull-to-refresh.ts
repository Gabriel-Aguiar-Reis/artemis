import { useCallback, useState } from 'react'

/**
 * Pull-to-refresh state for lists. `refreshing` is only true during the
 * user's gesture (not during background refetches caused by invalidation).
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }, [refetch])

  return { refreshing, onRefresh }
}
