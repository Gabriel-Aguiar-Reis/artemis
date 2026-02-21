import DrizzleCustomerRepository from '@/src/infra/repositories/drizzle/drizzle.customer.repository'
import { useInfiniteQuery } from '@tanstack/react-query'

const customerRepo = new DrizzleCustomerRepository()
const PAGE_SIZE = 50

export const useCustomersInfinite = () => {
  return useInfiniteQuery({
    queryKey: ['customers', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await customerRepo.getCustomersPaginated(
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
