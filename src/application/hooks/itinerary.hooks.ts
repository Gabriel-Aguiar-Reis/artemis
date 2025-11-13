import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import DrizzleItineraryRepository from '@/src/infra/repositories/drizzle/drizzle.itinerary.repository'

const itineraryRepo = new DrizzleItineraryRepository()
export const itineraryHooks = createRepositoryHooks(
  itineraryRepo,
  'itineraries'
)
