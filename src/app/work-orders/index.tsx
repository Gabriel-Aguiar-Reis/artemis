import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { WhatsAppService } from '@/src/application/services/whatsapp.service'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import { BackToTopButton } from '@/src/components/ui/back-to-top-button'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ConfirmDeleteDialog } from '@/src/components/ui/dialog/confirm-delete-dialog'
import { NotesDialog } from '@/src/components/ui/dialog/notes-dialog'
import { WhatsAppSummaryDialog } from '@/src/components/ui/dialog/whatsapp-summary-dialog'
import { Text } from '@/src/components/ui/text'
import { WorkOrderCard } from '@/src/components/ui/work-order-card'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { smartSearch, UUID } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import {
  Edit,
  LucideIcon,
  Package,
  Plus,
  Receipt,
  ReceiptText,
  Trash2,
} from 'lucide-react-native'
import * as React from 'react'
import { useMemo, useRef, useState } from 'react'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function WorkOrdersScreen() {
  const { createdWorkOrderId } = useLocalSearchParams<{
    createdWorkOrderId?: string
  }>()
  const { data: workOrders, isLoading } = workOrderHooks.getWorkOrders()
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<{
    id: UUID
    customerName: string
    date: Date
  } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<{
    title: string
    notes?: string
  } | null>(null)
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)

  const { mutate: deleteWorkOrder } = workOrderHooks.deleteWorkOrder()

  // Adicionado useRef e useState para ScrollView e botão de voltar ao topo
  const scrollRef = useRef<ScrollView>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y
    setShowScrollBtn(offsetY > 0)
  }

  // Detectar quando uma work order foi criada e mostrar o dialog do WhatsApp
  React.useEffect(() => {
    if (createdWorkOrderId && workOrders) {
      setShowWhatsAppDialog(true)
    }
  }, [createdWorkOrderId, workOrders])

  const params = useLocalSearchParams<{
    search?: string // customer store name or contact name
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

    options.push({
      label: 'Excluir',
      icon: Trash2,
      destructive: true,
      onPress: () => {
        setSelectedWorkOrder({
          id: workOrder.id,
          customerName,
          date: date!,
        })
        setDeleteDialogOpen(true)
      },
    })

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

  const handleDeleteWorkOrder = (workOrderId: UUID) => {
    deleteWorkOrder(workOrderId)
    setDeleteDialogOpen(false)
  }

  // Função para enviar mensagem do WhatsApp
  const handleSendWhatsApp = () => {
    if (!createdWorkOrderId || !workOrders) {
      setShowWhatsAppDialog(false)
      // Limpar o parâmetro da URL
      router.replace('/work-orders')
      return
    }

    try {
      // Buscar a work order criada
      const workOrder = workOrders.find((wo) => wo.id === createdWorkOrderId)

      if (!workOrder) {
        throw new Error('Ordem de serviço não encontrada')
      }

      // Enviar mensagem via WhatsApp
      WhatsAppService.sendWorkOrderMessage(workOrder, false)

      setShowWhatsAppDialog(false)
      // Limpar o parâmetro da URL
      router.replace('/work-orders')
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      Toast.show({
        type: 'error',
        text1: 'Erro ao enviar mensagem',
        text2: error instanceof Error ? error.message : 'Erro desconhecido',
      })
      setShowWhatsAppDialog(false)
      // Limpar o parâmetro da URL
      router.replace('/work-orders')
    }
  }

  // Função para cancelar o envio do WhatsApp
  const handleCancelWhatsApp = () => {
    setShowWhatsAppDialog(false)
    // Limpar o parâmetro da URL
    router.replace('/work-orders')
  }

  const filteredWorkOrders = useMemo(() => {
    if (!workOrders) return []
    return workOrders.filter((wo) => {
      const matchesSearch = params.search
        ? smartSearch(wo.customer.storeName, params.search)
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
        ? wo.scheduledDate
            .toLocaleDateString('pt-BR')
            .includes(params.scheduledDate)
        : true
      const matchesVisitDate = params.visitDate
        ? wo.visitDate?.toLocaleDateString('pt-BR').includes(params.visitDate)
        : true
      const matchesMinTotalValue = params.minTotalValue
        ? wo.paymentOrder?.totalValue || 0 >= Number(params.minTotalValue)
        : true
      const matchesMaxTotalValue = params.maxTotalValue
        ? wo.paymentOrder?.totalValue || 0 <= Number(params.maxTotalValue)
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
    const filters = []
    if (params.search) {
      filters.push({ label: 'Busca', value: params.search })
    }
    if (params.phoneNumber) {
      filters.push({ label: 'Telefone', value: params.phoneNumber })
    }
    if (params.landlineNumber) {
      filters.push({ label: 'Telefone Fixo', value: params.landlineNumber })
    }
    if (params.isWhatsApp) {
      filters.push({
        label: 'WhatsApp',
        value: params.isWhatsApp === 'true' ? 'Sim' : 'Não',
      })
    }
    if (params.scheduledDate) {
      filters.push({ label: 'Data Agendada', value: params.scheduledDate })
    }
    if (params.visitDate) {
      filters.push({ label: 'Data de Visita', value: params.visitDate })
    }
    if (params.minTotalValue) {
      filters.push({ label: 'Valor Total Mínimo', value: params.minTotalValue })
    }
    if (params.maxTotalValue) {
      filters.push({ label: 'Valor Total Máximo', value: params.maxTotalValue })
    }
    if (params.isPaid) {
      filters.push({
        label: 'Pago',
        value: params.isPaid === 'true' ? 'Sim' : 'Não',
      })
    }
    if (params.hasPayment) {
      filters.push({
        label: 'Ordem de pagamento criada',
        value: params.hasPayment === 'true' ? 'Sim' : 'Não',
      })
    }
    if (params.hasResult) {
      filters.push({
        label: 'Relatório da ordem de serviço criado',
        value: params.hasResult === 'true' ? 'Sim' : 'Não',
      })
    }
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando ordens de serviço...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Ordens de Serviço',
          headerRight: () => (
            <View className="flex-row gap-2">
              <ButtonFilter
                href={{
                  pathname: '/work-orders/search',
                  params: {
                    ...params,
                  },
                }}
                isActive={hasActiveFilters}
              />
              <ButtonNew href="/work-orders/form" />
            </View>
          ),
        }}
      />
      {!workOrders || workOrders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhuma ordem de serviço cadastrada.{' \n'}
            Clique no + para adicionar.
          </Text>
        </View>
      ) : (
        <>
          <ActiveFiltersBanner
            filters={activeFilters}
            clearFiltersHref="/work-orders"
          />
          <ScrollView
            className="flex-1"
            ref={scrollRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View className="gap-3 p-4">
              {filteredWorkOrders.length === 0 ? (
                <View className="items-center py-12">
                  <Text className="text-center text-muted-foreground">
                    Nenhum produto encontrado com os filtros aplicados.
                  </Text>
                </View>
              ) : (
                <FlashList
                  data={filteredWorkOrders}
                  renderItem={({ item }) => (
                    <WorkOrderCard
                      wo={item}
                      onPress={() => handleWorkOrderOptions(item)}
                    />
                  )}
                  ListFooterComponent={<View className="h-16" />}
                />
              )}
            </View>
          </ScrollView>

          {/* Botão de voltar ao topo */}
          <BackToTopButton isVisible={showScrollBtn} scrollRef={scrollRef} />

          {selectedWorkOrder && (
            <ConfirmDeleteDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              title={`Excluir ordem de serviço do cliente "${selectedWorkOrder.customerName}"?`}
              handleDelete={() => {
                handleDeleteWorkOrder(selectedWorkOrder.id)
              }}
            />
          )}

          {selectedNotes && (
            <NotesDialog
              open={notesDialogOpen}
              onOpenChange={setNotesDialogOpen}
              title={selectedNotes.title}
              notes={selectedNotes.notes}
            />
          )}

          <WhatsAppSummaryDialog
            open={showWhatsAppDialog}
            onOpenChange={setShowWhatsAppDialog}
            title="Enviar resumo ao cliente?"
            description="Deseja enviar via WhatsApp o resumo desta ordem de serviço?"
            onConfirm={handleSendWhatsApp}
            onCancel={handleCancelWhatsApp}
          />
        </>
      )}
    </SafeAreaView>
  )
}
