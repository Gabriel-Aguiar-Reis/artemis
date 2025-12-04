import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import { DrizzleItineraryWorkOrderRepository } from '@/src/infra/repositories/drizzle/drizzle.itinerary-work-order.repository'

const itineraryWorkOrderRepo = new DrizzleItineraryWorkOrderRepository()
export const itineraryWorkOrderHooks = createRepositoryHooks(
  itineraryWorkOrderRepo,
  'itineraryWorkOrders',
  'Ordem de serviço do itinerário',
  'F'
)
