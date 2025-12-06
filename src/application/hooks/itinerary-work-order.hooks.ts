import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import { useInvalidateQueries } from '@/src/application/hooks/use-invalidate-queries'
import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { DrizzleItineraryWorkOrderRepository } from '@/src/infra/repositories/drizzle/drizzle.itinerary-work-order.repository'
import DrizzleItineraryRepository from '@/src/infra/repositories/drizzle/drizzle.itinerary.repository'
import { UUID } from '@/src/lib/utils'
import { useMutation } from '@tanstack/react-query'
import uuid from 'react-native-uuid'

const itineraryWorkOrderRepo = new DrizzleItineraryWorkOrderRepository()
const itineraryRepo = new DrizzleItineraryRepository()

export const itineraryWorkOrderHooks = createRepositoryHooks(
  itineraryWorkOrderRepo,
  'itineraryWorkOrders',
  'Ordem de serviço do itinerário',
  'F'
)

/**
 * Hook para adicionar automaticamente uma work order ao itinerário ativo
 * se a data agendada estiver dentro do período do itinerário
 */
export function useAutoAddWorkOrderToItinerary() {
  const invalidateQueries = useInvalidateQueries()

  return useMutation({
    mutationFn: async (workOrder: WorkOrder) => {
      // Buscar itinerário ativo
      const itinerary = await itineraryRepo.getActiveItinerary()

      if (!itinerary) {
        // Não há itinerário ativo, não faz nada
        return { added: false, reason: 'no-active-itinerary' }
      }

      // Verificar se a data agendada está dentro do período do itinerário
      const scheduledDate = workOrder.scheduledDate
      const isInPeriod =
        scheduledDate >= itinerary.initialItineraryDate &&
        scheduledDate <= itinerary.finalItineraryDate

      if (!isInPeriod) {
        // Data fora do período, não adiciona
        return { added: false, reason: 'date-out-of-range' }
      }

      // Verificar se já não está no itinerário
      const existingWorkOrders =
        await itineraryWorkOrderRepo.getItineraryWorkOrdersByItineraryId(
          itinerary.id
        )
      const alreadyExists = existingWorkOrders.some(
        (iwo) => iwo.workOrder.id === workOrder.id
      )

      if (alreadyExists) {
        return { added: false, reason: 'already-exists' }
      }

      // Adicionar ao itinerário na última posição
      const newPosition = existingWorkOrders.length + 1
      const itineraryWorkOrder = new ItineraryWorkOrder(
        uuid.v4() as UUID,
        itinerary.id,
        newPosition,
        workOrder,
        false // isLate
      )

      await itineraryWorkOrderRepo.addItineraryWorkOrder(itineraryWorkOrder)

      return { added: true, itineraryId: itinerary.id }
    },
    onSuccess: (result) => {
      if (result.added) {
        // Invalidar queries relacionadas
        invalidateQueries('itineraryWorkOrders')
        invalidateQueries('itineraries')
      }
    },
  })
}
