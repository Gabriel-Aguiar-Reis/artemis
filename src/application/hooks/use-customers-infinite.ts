import DrizzleCustomerRepository, {
  CustomerFilters,
} from '@/src/infra/repositories/drizzle/drizzle.customer.repository'
import { useInfiniteQuery } from '@tanstack/react-query'

const customerRepo = new DrizzleCustomerRepository()
const PAGE_SIZE = 50

export { CustomerFilters }

export const useCustomersInfinite = (filters?: CustomerFilters) => {
  // Normalizar filtros antes de passar para o repository
  const normalizedFilters: CustomerFilters | undefined = filters
    ? {
        search: filters.search,
        contactName: filters.contactName,
        phoneNumber: filters.phoneNumber
          ? filters.phoneNumber.replace(/\D+/g, '')
          : undefined,
        landlineNumber: filters.landlineNumber
          ? filters.landlineNumber.replace(/\D+/g, '')
          : undefined,
        isActiveWhatsApp: filters.isActiveWhatsApp,
      }
    : undefined

  return useInfiniteQuery({
    queryKey: ['customers', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await customerRepo.getCustomersPaginated(
        pageParam,
        PAGE_SIZE,
        normalizedFilters
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
