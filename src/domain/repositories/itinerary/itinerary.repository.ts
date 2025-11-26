import { Itinerary } from '@/src/domain/entities/itinerary/itinerary.entity'
import { AddItineraryDto } from '@/src/domain/repositories/itinerary/dtos/add-itinerary.dto'
import { UpdateItineraryDto } from '@/src/domain/repositories/itinerary/dtos/update-itinerary.dto'
import { UUID } from '@/src/lib/utils'

export abstract class ItineraryRepository {
  abstract getItineraries: () => Promise<Itinerary[]>
  abstract addItinerary: (dto: AddItineraryDto) => Promise<void>
  abstract updateItinerary: (dto: UpdateItineraryDto) => Promise<void>
  abstract deleteItinerary: (id: UUID) => Promise<void>
  abstract getItinerary: (id: UUID) => Promise<Itinerary | null>
  abstract getActiveItinerary: () => Promise<Itinerary | null>
  abstract getItinerariesByDateRange: (
    startDate: Date,
    endDate: Date
  ) => Promise<Itinerary[]>
  abstract finishItinerary: (id: UUID) => Promise<void>
}
