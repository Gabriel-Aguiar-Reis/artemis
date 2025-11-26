import { UUID } from '@/src/lib/utils'

export interface AddItineraryDto {
  initialItineraryDate: string
  finalItineraryDate: string
  workOrderIds: UUID[]
}
