import { Itinerary } from '@/src/domain/entities/itinerary/itinerary.entity'
import {
  ItineraryInsertDTO,
  ItineraryUpdateDTO,
} from '@/src/domain/validations/itinerary.schema'
import { UUID } from '@/src/lib/utils'

export abstract class ItineraryRepository {
  abstract getItineraries: () => Promise<Itinerary[]>
  abstract addItinerary: (dto: ItineraryInsertDTO) => Promise<void>
  abstract updateItinerary: (dto: ItineraryUpdateDTO) => Promise<void>
  abstract deleteItinerary: (id: UUID) => Promise<void>
  abstract getItinerary: (id: UUID) => Promise<Itinerary | null>
  abstract getActiveItinerary: () => Promise<Itinerary | null>
  abstract getItinerariesByDateRange: (
    startDate: Date,
    endDate: Date
  ) => Promise<Itinerary[]>
  abstract finishItinerary: (id: UUID) => Promise<void>
}
