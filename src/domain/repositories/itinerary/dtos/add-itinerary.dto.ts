import { UUID } from 'crypto'

export interface AddItineraryDto {
  initialItineraryDate: string
  finalItineraryDate: string
  workOrderIds: UUID[]
}
