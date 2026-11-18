import { useCallback, useState } from 'react'

/**
 * Estado de pull-to-refresh para listas. `refreshing` só fica true durante o
 * gesto do usuário (não em refetchs de fundo causados por invalidação).
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
