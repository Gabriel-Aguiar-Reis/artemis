import { itineraryWorkOrderHooks } from '@/src/application/hooks/itinerary-work-order.hooks'
import { itineraryHooks } from '@/src/application/hooks/itinerary.hooks'
import { WhatsAppService } from '@/src/application/services/whatsapp.service'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import { BackToTopButton } from '@/src/components/ui/back-to-top-button'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonFinish } from '@/src/components/ui/button-finish'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ButtonReorder } from '@/src/components/ui/button-reorder'
import { NotesDialog } from '@/src/components/ui/dialog/notes-dialog'
import { Text } from '@/src/components/ui/text'
import { WorkOrderCard } from '@/src/components/ui/work-order-card'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { UUID } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import {
  Edit,
  LucideIcon,
  Package,
  Plus,
  Receipt,
  ReceiptText,
} from 'lucide-react-native'
import React, { useMemo, useRef, useState } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import {
  GestureHandlerRootView,
  ScrollView,
} from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ItineraryScreen() {
  const router = useRouter()
  const [selectedNotes, setSelectedNotes] = useState<{
    title: string
    notes?: string
  } | null>(null)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)

  const { data: itinerary, isLoading } = itineraryHooks.getActiveItinerary()
  const { data: workOrders } =
    itineraryWorkOrderHooks.getItineraryWorkOrdersByItineraryId(
      itinerary?.id || ('' as UUID)
    )

  const flatListRef = useRef<ScrollView>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y
    setShowScrollBtn(offsetY > 0)
  }

  const scrollToTop = () => {
    flatListRef.current?.scrollTo({ y: 0, animated: true })
  }

  const handleWorkOrderOptions = async (workOrder: WorkOrder) => {
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
    // Grupo: Ordem de Serviço
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

    // Grupo: Resultado
    if (workOrder.result) {
      options.push({
        label: 'Acessar Relatório',
        icon: ReceiptText,
        onPress: () => {
          router.push(`/work-orders/${workOrder.id}/result`)
        },
      })
    } else {
      options.push({
        label: 'Criar Relatório',
        icon: Plus,
        onPress: () => {
          router.push(`/work-orders/${workOrder.id}/result/create`)
        },
      })
    }

    // Grupo: Pagamento
    if (workOrder.paymentOrder) {
      options.push({
        label: 'Acessar Pagamento',
        icon: Receipt,
        onPress: () => {
          router.push(`/work-orders/${workOrder.id}/payment`)
        },
      })
    } else if (workOrder.result) {
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
            console.error('Erro ao enviar WhatsApp:', error)
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
            console.error('Erro ao enviar WhatsApp:', error)
          }
        },
        isWhatsApp: true,
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
  }

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

  const filteredWorkOrders = useMemo(() => {
    if (!workOrders) return []
    return workOrders.filter((iwo) => {
      const wo = iwo.workOrder
      const matchesSearch = params.search
        ? wo.customer.storeName
            .toLowerCase()
            .includes((params.search as string).toLowerCase())
        : true

      const matchesPhoneNumber = (() => {
        if (!params.phoneNumber) return true
        const phone = wo.customer.phoneNumber || ''
        return String(phone).includes(params.phoneNumber as string)
      })()

      const matchesLandlineNumber = (() => {
        if (!params.landlineNumber) return true
        const phone = wo.customer.landlineNumber || ''
        return String(phone).includes(params.landlineNumber as string)
      })()

      const matchesIsWhatsApp = params.isWhatsApp
        ? wo.customer.isActiveWhatsApp() === (params.isWhatsApp === 'true')
        : true

      const matchesScheduledDate = params.scheduledDate
        ? wo.scheduledDate
            .toLocaleDateString('pt-BR')
            .includes(params.scheduledDate as string)
        : true

      const matchesVisitDate = params.visitDate
        ? wo.visitDate
            ?.toLocaleDateString('pt-BR')
            .includes(params.visitDate as string)
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

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1">
        <Stack.Screen
          options={{
            headerTitle: 'Itinerário',
            headerRight: () => (
              <View className="flex-row gap-2">
                {itinerary && <ButtonReorder href="/itinerary/reorder" />}
                <ButtonFilter
                  href={{
                    pathname: '/itinerary/search',
                    params: { ...params },
                  }}
                  isActive={hasActiveFilters}
                />
                {itinerary && !itinerary.isFinished ? (
                  <ButtonFinish href="/itinerary/finish" />
                ) : (
                  <ButtonNew href="/itinerary/form" />
                )}
                {/* Novo botão para editar ordenação */}
              </View>
            ),
          }}
        />
        {isLoading ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-muted-foreground">
              Carregando itinerário...
            </Text>
          </View>
        ) : !itinerary ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-muted-foreground">
              Nenhum Itinerário sendo utilizado.{' \n'}
              Clique no + para fazer um novo.
            </Text>
          </View>
        ) : (
          <>
            <Text className="font-bold text-center border-b border-border pb-2">
              Itinerário{' '}
              {itinerary.initialItineraryDate.toLocaleDateString('pt-BR')} -{' '}
              {itinerary.finalItineraryDate.toLocaleDateString('pt-BR')}
            </Text>

            <ScrollView
              ref={flatListRef}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {!filteredWorkOrders || filteredWorkOrders.length === 0 ? (
                <View className="flex-1 items-center justify-center px-4">
                  <Text className="text-center text-muted-foreground">
                    Há algo errado!{'\n'}
                    Nenhuma ordem de serviço encontrada{'\n'}
                    no período escolhido.
                  </Text>
                </View>
              ) : (
                <View className="flex-1">
                  <ActiveFiltersBanner
                    filters={activeFilters}
                    clearFiltersHref="/itinerary"
                  />
                  <FlashList
                    data={filteredWorkOrders}
                    renderItem={({ item }) => (
                      <View key={item.id} className="px-4">
                        <WorkOrderCard
                          wo={item.workOrder}
                          onPress={() => handleWorkOrderOptions(item.workOrder)}
                        />
                      </View>
                    )}
                    ListHeaderComponent={<View className="h-4" />}
                    ListFooterComponent={<View className="h-16" />}
                  />
                </View>
              )}
            </ScrollView>
            {/* Botão de voltar ao topo */}
            <BackToTopButton isVisible={showScrollBtn} onPress={scrollToTop} />

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
