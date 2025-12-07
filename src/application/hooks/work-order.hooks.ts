import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import { useAutoAddWorkOrderToItinerary } from '@/src/application/hooks/itinerary-work-order.hooks'
import { useInvalidateQueries } from '@/src/application/hooks/use-invalidate-queries'
import { WorkOrderInsertDTO } from '@/src/domain/validations/work-order.schema'
import DrizzleWorkOrderRepository from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'
import { useMutation } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'

const workOrderRepo = new DrizzleWorkOrderRepository()
export const workOrderHooks = {
  ...createRepositoryHooks(
    workOrderRepo,
    'workOrders',
    'ordem de serviço',
    'F'
  ),

  /**
   * Hook customizado para adicionar work order
   * Automaticamente adiciona ao itinerário ativo se a data estiver no período
   */
  useAddWorkOrderWithItinerary: () => {
    const invalidateQueries = useInvalidateQueries()
    const { mutateAsync: autoAddToItinerary } = useAutoAddWorkOrderToItinerary()

    return useMutation({
      mutationFn: async (data: WorkOrderInsertDTO) => {
        // Adicionar a work order
        const id = await workOrderRepo.addWorkOrder(data)

        // Buscar a work order criada para ter o objeto completo
        const wo = await workOrderRepo.getWorkOrder(id)

        if (!wo) {
          throw new Error('Work order criada mas não encontrada')
        }

        // Se já houver resultado, nunca adicionar ao itinerário
        if (wo.result) {
          return {
            workOrder: wo,
            itineraryResult: {
              added: false,
              reason: 'has-result',
            },
          }
        }

        // Permitir que o caller previna a adição automática ao itinerário
        const preventAutoAdd = (data as any).preventItineraryAutoAdd === true
        if (preventAutoAdd) {
          return {
            workOrder: wo,
            itineraryResult: {
              added: false,
              reason: 'prevented',
            },
          }
        }
        // Tentar adicionar ao itinerário automaticamente
        const result = await autoAddToItinerary(wo)

        return { workOrder: wo, itineraryResult: result }
      },
      onSuccess: (data) => {
        // Invalidar queries
        invalidateQueries('workOrders')
        invalidateQueries('itineraries')
        invalidateQueries('itineraryWorkOrders')

        // Mostrar toast apropriado
        if (data.itineraryResult.added) {
          Toast.show({
            type: 'success',
            text1: 'Ordem de serviço adicionada!',
            text2: 'Também foi adicionada ao itinerário ativo',
          })
        } else {
          Toast.show({
            type: 'success',
            text1: 'Ordem de serviço adicionada!',
          })
        }
      },
      onError: () => {
        Toast.show({
          type: 'error',
          text1: 'Erro ao adicionar ordem de serviço!',
        })
      },
    })
  },
}
