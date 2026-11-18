import DrizzleWorkOrderRepository, {
  WorkOrderFilters,
} from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

const workOrderRepo = new DrizzleWorkOrderRepository()
const PAGE_SIZE = 50

export { WorkOrderFilters }

export const useWorkOrdersInfinite = (
  filters?: WorkOrderFilters,
  options: { enabled?: boolean } = {}
) => {
  // Normalize filters before passing them to the repository
  const normalizedFilters: WorkOrderFilters | undefined = filters
    ? {
        search: filters.search,
        phoneNumber: filters.phoneNumber
          ? filters.phoneNumber.replace(/\D+/g, '')
          : undefined,
        landlineNumber: filters.landlineNumber
          ? filters.landlineNumber.replace(/\D+/g, '')
          : undefined,
        isWhatsApp: filters.isWhatsApp,
        scheduledDate: filters.scheduledDate,
        scheduledFrom: filters.scheduledFrom,
        scheduledTo: filters.scheduledTo,
        nextVisitFrom: filters.nextVisitFrom,
        nextVisitTo: filters.nextVisitTo,
        hasNextVisit: filters.hasNextVisit,
        visitDate: filters.visitDate,
        minTotalValue: filters.minTotalValue,
        maxTotalValue: filters.maxTotalValue,
        isPaid: filters.isPaid,
        hasPayment: filters.hasPayment,
        hasResult: filters.hasResult,
        isExpired: filters.isExpired,
        isCopied: filters.isCopied,
      }
    : undefined

  return useInfiniteQuery({
    queryKey: ['workOrders', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await workOrderRepo.getWorkOrdersPaginated(
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
    // Work orders are fetched on demand (search/filters); see the list screen
    enabled: options.enabled ?? true,
    staleTime: 1000 * 30, // 30 seconds
  })
}

/** Work orders per scheduled month for the same filters (list headers) */
export const useWorkOrderMonthCounts = (
  filters?: WorkOrderFilters,
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: ['workOrders', 'monthCounts', filters],
    queryFn: () =>
      workOrderRepo.getWorkOrderMonthCounts({
        ...filters,
        phoneNumber: filters?.phoneNumber?.replace(/\D+/g, '') || undefined,
        landlineNumber:
          filters?.landlineNumber?.replace(/\D+/g, '') || undefined,
      }),
    enabled: options.enabled ?? true,
    staleTime: 1000 * 30,
  })
