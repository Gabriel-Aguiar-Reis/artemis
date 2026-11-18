import { itineraryWorkOrderHooks } from '@/src/application/hooks/itinerary-work-order.hooks'
import { itineraryHooks } from '@/src/application/hooks/itinerary.hooks'
import { usePersistedTabFilters } from '@/src/application/hooks/use-persisted-tab-filters'
import { usePullToRefresh } from '@/src/application/hooks/use-pull-to-refresh'
import { WhatsAppService } from '@/src/application/services/whatsapp.service'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import {
  BackToTopButton,
  useBackToTop,
} from '@/src/components/ui/back-to-top-button'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonFinish } from '@/src/components/ui/button-finish'
import { ButtonHistory } from '@/src/components/ui/button-history'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ButtonReorder } from '@/src/components/ui/button-reorder'
import { NotesDialog } from '@/src/components/ui/dialog/notes-dialog'
import { Icon } from '@/src/components/ui/icon'
import { ErrorState, LoadingState } from '@/src/components/ui/list-states'
import { Text } from '@/src/components/ui/text'
import { WorkOrderCard } from '@/src/components/ui/work-order-card'
import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { smartSearch, UUID } from '@/src/lib/utils'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import {
  Clock,
  Copy,
  Edit,
  LucideIcon,
  Package,
  Plus,
  Receipt,
  ReceiptText,
} from 'lucide-react-native'
import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'

const keyExtractor = (item: ItineraryWorkOrder) => item.id

export default function ItineraryScreen() {
  const router = useRouter()
  const [selectedNotes, setSelectedNotes] = useState<{
    title: string
    notes?: string
  } | null>(null)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)

  const {
    data: itinerary,
    isLoading,
    isError,
    refetch: refetchItinerary,
  } = itineraryHooks.getActiveItinerary()
  const {
    data: workOrders,
    isLoading: isLoadingWorkOrders,
    isError: isErrorWorkOrders,
    refetch: refetchWorkOrders,
  } = itineraryWorkOrderHooks.getItineraryWorkOrdersByItineraryId(
    itinerary?.id || ('' as UUID)
  )

  const refetchAll = useCallback(
    () => Promise.all([refetchItinerary(), refetchWorkOrders()]),
    [refetchItinerary, refetchWorkOrders]
  )
  const { refreshing, onRefresh } = usePullToRefresh(refetchAll)
  const {
    listRef,
    isVisible: showScrollBtn,
    onScroll,
  } = useBackToTop<FlashListRef<ItineraryWorkOrder>>()

  const handleWorkOrderOptions = useCallback(
    async (workOrder: WorkOrder) => {
      const customerName = workOrder.customer.storeName
      const date = workOrder.scheduledDate || workOrder.visitDate

      const options: {
        label: string
        icon?: LucideIcon
        onPress: () => void
        destructive?: boolean
        isWhatsApp?: boolean
      }[] = []

      options.push({
        label: 'Ver Observações',
        icon: ReceiptText,
        onPress: () => {
          setSelectedNotes({
            title: `${customerName} - ${date?.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })}`,
            notes: workOrder.notes,
          })
          setNotesDialogOpen(true)
        },
      })
      // Group: Work Order
      options.push({
        label: 'Editar Cabeçalho da Ordem',
        icon: Edit,
        onPress: () => {
          router.push(`/work-orders/${workOrder.id}/edit`)
        },
      })

      options.push({
        label: 'Acessar Produtos Agendados',
        icon: Package,
        onPress: () => {
          router.push(`/work-orders/${workOrder.id}/products`)
        },
      })

      // Group: Result
      if (workOrder.result) {
        options.push({
          label: 'Acessar Relatório',
          icon: ReceiptText,
          onPress: () => {
            router.push(`/work-orders/${workOrder.id}/result`)
          },
        })
      } else if (
        workOrder.status !== 'EXPIRED' &&
        workOrder.status !== 'COPIED'
      ) {
        options.push({
          label: 'Criar Relatório',
          icon: Plus,
          onPress: () => {
            router.push(`/work-orders/${workOrder.id}/result/create`)
          },
        })
      }

      // Group: Payment
      if (workOrder.paymentOrder) {
        options.push({
          label: 'Acessar Pagamento',
          icon: Receipt,
          onPress: () => {
            router.push(`/work-orders/${workOrder.id}/payment`)
          },
        })
      } else if (
        workOrder.result &&
        workOrder.status !== 'EXPIRED' &&
        workOrder.status !== 'COPIED'
      ) {
        options.push({
          label: 'Criar Pagamento',
          icon: Plus,
          onPress: () => {
            router.push(`/work-orders/${workOrder.id}/payment/create`)
          },
        })
      }

      // WhatsApp
      if (workOrder.customer.isActiveWhatsApp()) {
        options.push({
          label: 'Avisar cliente da visita',
          onPress: () => {
            try {
              WhatsAppService.sendWorkOrderMessage(workOrder, true)
            } catch (error) {
              console.error('Error sending WhatsApp message:', error)
            }
          },
          isWhatsApp: true,
        })

        options.push({
          label: 'Enviar resumo ao cliente',
          onPress: () => {
            try {
              WhatsAppService.sendWorkOrderMessage(workOrder, false)
            } catch (error) {
              console.error('Error sending WhatsApp message:', error)
            }
          },
          isWhatsApp: true,
        })
      }

      // Clone (if it has result and payment OR is EXPIRED)
      if (
        (workOrder.result && workOrder.paymentOrder) ||
        workOrder.status === 'EXPIRED'
      ) {
        options.push({
          label: 'Clonar Ordem de Serviço',
          icon: Copy,
          onPress: () => {
            router.push(`/work-orders/${workOrder.id}/clone` as any)
          },
        })
      }

      await SheetManager.show('options-sheet', {
        payload: {
          title: `${customerName} - ${date?.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })}`,
          options,
        },
      })
    },
    [router]
  )

  const params = useLocalSearchParams<{
    search?: string
    phoneNumber?: string
    landlineNumber?: string
    isWhatsApp?: string
    scheduledDate?: string
    visitDate?: string
    minTotalValue?: string
    maxTotalValue?: string
    isPaid?: string
    hasPayment?: string
    hasResult?: string
  }>()
  // Filters survive closing the app
  usePersistedTabFilters('itinerary', params)

  // Helper to compare if two dates are the same day (ignoring time)
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  const filteredWorkOrders = useMemo(() => {
    if (!workOrders) return []
    return workOrders.filter((iwo) => {
      const wo = iwo.workOrder
      const matchesSearch = params.search
        ? smartSearch(wo.customer.storeName, params.search) ||
          smartSearch(wo.customer.contactName, params.search)
        : true

      const matchesPhoneNumber = (() => {
        if (!params.phoneNumber) return true
        if (!wo.customer.phoneNumber) return false
        const needle = String(params.phoneNumber).replace(/\D+/g, '')
        const hay = String(wo.customer.phoneNumber.value).replace(/\D+/g, '')
        return needle === '' ? true : hay.includes(needle)
      })()

      const matchesLandlineNumber = (() => {
        if (!params.landlineNumber) return true
        if (!wo.customer.landlineNumber) return false
        const needle = String(params.landlineNumber).replace(/\D+/g, '')
        const hay = String(wo.customer.landlineNumber.value).replace(/\D+/g, '')
        return needle === '' ? true : hay.includes(needle)
      })()

      const matchesIsWhatsApp = params.isWhatsApp
        ? wo.customer.isActiveWhatsApp() === (params.isWhatsApp === 'true')
        : true

      const matchesScheduledDate = params.scheduledDate
        ? isSameDay(wo.scheduledDate, new Date(params.scheduledDate))
        : true

      const matchesVisitDate = params.visitDate
        ? wo.visitDate && isSameDay(wo.visitDate, new Date(params.visitDate))
        : true

      const totalValue = wo.paymentOrder?.totalValue || 0
      const matchesMinTotalValue = params.minTotalValue
        ? totalValue >= Number(params.minTotalValue)
        : true
      const matchesMaxTotalValue = params.maxTotalValue
        ? totalValue <= Number(params.maxTotalValue)
        : true

      const matchesIsPaid = params.isPaid
        ? wo.paymentOrder?.isPaid === (params.isPaid === 'true')
        : true
      const matchesHasPayment = params.hasPayment
        ? (wo.paymentOrder !== null && wo.paymentOrder !== undefined) ===
          (params.hasPayment === 'true')
        : true
      const matchesHasResult = params.hasResult
        ? (wo.result !== null && wo.result !== undefined) ===
          (params.hasResult === 'true')
        : true

      return (
        matchesSearch &&
        matchesPhoneNumber &&
        matchesLandlineNumber &&
        matchesIsWhatsApp &&
        matchesScheduledDate &&
        matchesVisitDate &&
        matchesMinTotalValue &&
        matchesMaxTotalValue &&
        matchesIsPaid &&
        matchesHasPayment &&
        matchesHasResult
      )
    })
  }, [
    workOrders,
    params.search,
    params.phoneNumber,
    params.landlineNumber,
    params.isWhatsApp,
    params.scheduledDate,
    params.visitDate,
    params.minTotalValue,
    params.maxTotalValue,
    params.isPaid,
    params.hasPayment,
    params.hasResult,
  ])

  const hasActiveFilters =
    !!params.search ||
    !!params.phoneNumber ||
    !!params.landlineNumber ||
    !!params.isWhatsApp ||
    !!params.scheduledDate ||
    !!params.visitDate ||
    !!params.minTotalValue ||
    !!params.maxTotalValue ||
    !!params.isPaid ||
    !!params.hasPayment ||
    !!params.hasResult

  const activeFilters = useMemo(() => {
    const filters: { label: string; value: string }[] = []
    if (params.search) filters.push({ label: 'Busca', value: params.search })
    if (params.phoneNumber)
      filters.push({ label: 'Telefone', value: params.phoneNumber })
    if (params.landlineNumber)
      filters.push({ label: 'Telefone Fixo', value: params.landlineNumber })
    if (params.isWhatsApp)
      filters.push({
        label: 'WhatsApp',
        value: params.isWhatsApp === 'true' ? 'Sim' : 'Não',
      })
    if (params.scheduledDate)
      filters.push({ label: 'Data Agendada', value: params.scheduledDate })
    if (params.visitDate)
      filters.push({ label: 'Data de Visita', value: params.visitDate })
    if (params.minTotalValue)
      filters.push({ label: 'Valor Total Mínimo', value: params.minTotalValue })
    if (params.maxTotalValue)
      filters.push({ label: 'Valor Total Máximo', value: params.maxTotalValue })
    if (params.isPaid)
      filters.push({
        label: 'Pago',
        value: params.isPaid === 'true' ? 'Sim' : 'Não',
      })
    if (params.hasPayment)
      filters.push({
        label: 'Ordem de pagamento criada',
        value: params.hasPayment === 'true' ? 'Sim' : 'Não',
      })
    if (params.hasResult)
      filters.push({
        label: 'Relatório da ordem de serviço criado',
        value: params.hasResult === 'true' ? 'Sim' : 'Não',
      })
    return filters
  }, [
    params.search,
    params.phoneNumber,
    params.landlineNumber,
    params.isWhatsApp,
    params.scheduledDate,
    params.visitDate,
    params.minTotalValue,
    params.maxTotalValue,
    params.isPaid,
    params.hasPayment,
    params.hasResult,
  ])

  const renderItem = useCallback(
    ({ item }: { item: ItineraryWorkOrder }) => (
      <WorkOrderCard
        wo={item.workOrder}
        isLate={item.isLate}
        onOptions={handleWorkOrderOptions}
      />
    ),
    [handleWorkOrderOptions]
  )

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView edges={['left', 'right']} className="flex-1">
        <Stack.Screen
          options={{
            headerTitle: 'Itinerário',
            headerRight: () => (
              <View className="flex-row gap-2">
                {itinerary && (
                  <>
                    <ButtonReorder href="/itinerary/reorder" />
                    <ButtonFilter
                      href={{
                        pathname: '/itinerary/search',
                        params: { ...params },
                      }}
                      isActive={hasActiveFilters}
                    />
                  </>
                )}
                {itinerary && !itinerary.isFinished ? (
                  <ButtonFinish href="/itinerary/finish" />
                ) : !itinerary ? (
                  <>
                    <ButtonHistory href="/itinerary/history" />
                    <ButtonNew href="/itinerary/form" />
                  </>
                ) : (
                  <ButtonNew href="/itinerary/form" />
                )}
              </View>
            ),
          }}
        />
        {isLoading ? (
          <LoadingState label="Carregando itinerário..." />
        ) : isError ? (
          <ErrorState
            message="Não foi possível carregar o itinerário."
            onRetry={() => refetchItinerary()}
          />
        ) : !itinerary ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-muted-foreground">
              Nenhum Itinerário sendo utilizado.{' \n'}
              Clique no + para fazer um novo.
            </Text>
          </View>
        ) : (
          <>
            <View className="flex-row items-center justify-center gap-2 py-3 bg-card border-b border-border">
              <Icon as={Clock} size={20} className="text-muted-foreground" />
              <Text className="font-bold text-center">
                {itinerary.initialItineraryDate.toLocaleDateString('pt-BR')} -{' '}
                {itinerary.finalItineraryDate.toLocaleDateString('pt-BR')}
              </Text>
            </View>

            {isLoadingWorkOrders ? (
              <LoadingState label="Carregando ordens de serviço..." />
            ) : isErrorWorkOrders && !workOrders ? (
              <ErrorState
                message="Não foi possível carregar as ordens do itinerário."
                onRetry={() => refetchWorkOrders()}
              />
            ) : (
              <FlashList
                ref={listRef}
                data={filteredWorkOrders}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                onScroll={onScroll}
                scrollEventThrottle={16}
                refreshing={refreshing}
                onRefresh={onRefresh}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 64,
                }}
                ListHeaderComponent={
                  <View className="-mx-4">
                    <ActiveFiltersBanner
                      filters={activeFilters}
                      clearFiltersHref="/itinerary"
                    />
                  </View>
                }
                ListEmptyComponent={
                  <View className="items-center justify-center px-4 py-12">
                    <Text className="text-center text-muted-foreground">
                      {hasActiveFilters
                        ? 'Nenhuma ordem de serviço encontrada com os filtros aplicados.'
                        : 'Nenhuma OS neste itinerário'}
                    </Text>
                  </View>
                }
              />
            )}
            <BackToTopButton isVisible={showScrollBtn} scrollRef={listRef} />

            {selectedNotes && (
              <NotesDialog
                open={notesDialogOpen}
                onOpenChange={setNotesDialogOpen}
                title={selectedNotes.title}
                notes={selectedNotes.notes}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}
