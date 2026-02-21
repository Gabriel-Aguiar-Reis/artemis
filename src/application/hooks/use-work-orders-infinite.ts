import DrizzleWorkOrderRepository from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'
import { useInfiniteQuery } from '@tanstack/react-query'

const workOrderRepo = new DrizzleWorkOrderRepository()
const PAGE_SIZE = 50

export const useWorkOrdersInfinite = () => {
  return useInfiniteQuery({
    queryKey: ['workOrders', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await workOrderRepo.getWorkOrdersPaginated(
        pageParam,
        PAGE_SIZE
      )
      return {
        ...result,
        page: pageParam,
      }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 30, // 30 segundos
  })
}
