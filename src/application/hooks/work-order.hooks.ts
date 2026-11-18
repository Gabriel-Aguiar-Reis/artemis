import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import { useAutoAddWorkOrderToItinerary } from '@/src/application/hooks/itinerary-work-order.hooks'
import { useInvalidateQueries } from '@/src/application/hooks/use-invalidate-queries'
import { WorkOrderInsertDTO } from '@/src/domain/validations/work-order.schema'
import DrizzleWorkOrderRepository, {
  CreateWorkOrderInput,
  PaymentInput,
  ResultInput,
} from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'
import { UUID } from '@/src/lib/utils'
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
   * Custom hook to add a work order
   * Automatically adds it to the active itinerary if the date is within the period
   */
  useAddWorkOrderWithItinerary: () => {
    const invalidateQueries = useInvalidateQueries()
    const { mutateAsync: autoAddToItinerary } = useAutoAddWorkOrderToItinerary()

    return useMutation({
      mutationFn: async (data: WorkOrderInsertDTO) => {
        // Add the work order
        const id = await workOrderRepo.addWorkOrder(data)

        // Fetch the created work order to get the full object
        const wo = await workOrderRepo.getWorkOrder(id)

        if (!wo) {
          throw new Error('Work order criada mas não encontrada')
        }

        // If it already has a result, never add to the itinerary
        if (wo.result) {
          return {
            workOrder: wo,
            itineraryResult: {
              added: false,
              reason: 'has-result',
            },
          }
        }

        // Allow the caller to prevent the automatic addition to the itinerary
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
        // Try to add to the itinerary automatically
        const result = await autoAddToItinerary(wo)

        return { workOrder: wo, itineraryResult: result }
      },
      onSuccess: (data) => {
        // Invalidate queries
        invalidateQueries('workOrders')
        invalidateQueries('itineraries')
        invalidateQueries('itineraryWorkOrders')

        // Show the appropriate toast
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

  /**
   * Clones a finished/partial work order and tries to add it to the active itinerary
   * if the new date is within the period.
   */
  useCloneWorkOrderWithItinerary: () => {
    const invalidateQueries = useInvalidateQueries()
    const { mutateAsync: autoAddToItinerary } = useAutoAddWorkOrderToItinerary()

    return useMutation({
      // args: [originalId, newScheduledDate, newPaymentOrder?]
      mutationFn: async ([originalId, newScheduledDate, newPaymentOrder]: [
        UUID,
        Date,
        any?,
      ]) => {
        // Clone in the database and get the new order's ID
        const newId = await workOrderRepo.addCreateFromFinished(
          originalId,
          newScheduledDate,
          newPaymentOrder
        )

        // Fetch the full new work order
        const newWo = await workOrderRepo.getWorkOrder(newId)
        if (!newWo) throw new Error('Nova ordem clonada não encontrada.')

        // Try to auto-add to the active itinerary
        const itineraryResult = await autoAddToItinerary(newWo)

        return { workOrder: newWo, itineraryResult }
      },
      onSuccess: (data) => {
        invalidateQueries('workOrders')
        invalidateQueries('itineraries')
        invalidateQueries('itineraryWorkOrders')

        if (data.itineraryResult.added) {
          Toast.show({
            type: 'success',
            text1: 'Ordem clonada e adicionada ao itinerário!',
          })
        } else {
          Toast.show({
            type: 'success',
            text1: 'Ordem clonada com sucesso!',
          })
        }
      },
      onError: (error) => {
        Toast.show({
          type: 'error',
          text1: 'Erro ao clonar ordem de serviço!',
          text2: error.message,
        })
      },
    })
  },

  /** Standalone read (outside a hook), for one-off actions such as WhatsApp. */
  getWorkOrderById: (id: UUID) => workOrderRepo.getWorkOrder(id),

  /**
   * Creates the full work order (items + report + payment) in a single transaction and,
   * if it is still open, tries to include it in the active itinerary.
   */
  useCreateWorkOrderWithDetails: () => {
    const invalidateQueries = useInvalidateQueries()
    const { mutateAsync: autoAddToItinerary } = useAutoAddWorkOrderToItinerary()

    return useMutation({
      mutationFn: async (input: CreateWorkOrderInput) => {
        const id = await workOrderRepo.addWorkOrderWithDetails(input)
        const wo = await workOrderRepo.getWorkOrder(id)
        if (!wo) throw new Error('Ordem de serviço criada mas não encontrada.')
        const itineraryResult = wo.result
          ? { added: false, reason: 'has-result' }
          : await autoAddToItinerary(wo)
        return { workOrder: wo, itineraryResult }
      },
      onSuccess: (data) => {
        invalidateQueries('workOrders')
        invalidateQueries('paymentOrders')
        invalidateQueries('itineraries')
        invalidateQueries('itineraryWorkOrders')
        Toast.show({
          type: 'success',
          text1: 'Ordem de serviço criada!',
          text2: data.itineraryResult.added
            ? 'Também foi adicionada ao itinerário ativo'
            : undefined,
        })
      },
      onError: (error) => {
        Toast.show({
          type: 'error',
          text1: 'Erro ao criar ordem de serviço',
          text2: error.message,
        })
      },
    })
  },

  /** Creates and links the work order's payment (transactional). */
  useAddPaymentToWorkOrder: () => {
    const invalidateQueries = useInvalidateQueries()
    return useMutation({
      mutationFn: ({
        workOrderId,
        payment,
      }: {
        workOrderId: UUID
        payment: PaymentInput
      }) => workOrderRepo.addPaymentToWorkOrder(workOrderId, payment),
      onSuccess: () => {
        invalidateQueries('workOrders')
        invalidateQueries('paymentOrders')
        invalidateQueries('itineraryWorkOrders')
        Toast.show({ type: 'success', text1: 'Pagamento registrado!' })
      },
      onError: (error) => {
        Toast.show({
          type: 'error',
          text1: 'Erro ao registrar pagamento',
          text2: error.message,
        })
      },
    })
  },

  /** Records the visit report of an open work order (transactional). */
  useSaveWorkOrderResult: () => {
    const invalidateQueries = useInvalidateQueries()
    return useMutation({
      mutationFn: ({
        workOrderId,
        result,
      }: {
        workOrderId: UUID
        result: ResultInput
      }) => workOrderRepo.addResultToWorkOrder(workOrderId, result),
      onSuccess: () => {
        invalidateQueries('workOrders')
        invalidateQueries('workOrderResults')
        invalidateQueries('paymentOrders')
        invalidateQueries('itineraryWorkOrders')
        Toast.show({ type: 'success', text1: 'Relatório salvo!' })
      },
      onError: (error) => {
        Toast.show({
          type: 'error',
          text1: 'Erro ao salvar relatório',
          text2: error.message,
        })
      },
    })
  },

  /** Fixes the items of an existing report (transactional). */
  useUpdateWorkOrderResult: () => {
    const invalidateQueries = useInvalidateQueries()
    return useMutation({
      mutationFn: ({
        resultId,
        result,
      }: {
        resultId: UUID
        result: ResultInput
      }) => workOrderRepo.updateWorkOrderResultItems(resultId, result),
      onSuccess: () => {
        invalidateQueries('workOrders')
        invalidateQueries('workOrderResults')
        invalidateQueries('paymentOrders')
        invalidateQueries('itineraryWorkOrders')
        Toast.show({ type: 'success', text1: 'Relatório atualizado!' })
      },
      onError: (error) => {
        Toast.show({
          type: 'error',
          text1: 'Erro ao atualizar relatório',
          text2: error.message,
        })
      },
    })
  },
}
