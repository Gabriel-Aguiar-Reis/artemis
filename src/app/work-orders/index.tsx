import { useWorkOrdersInfinite } from '@/src/application/hooks/use-work-orders-infinite'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { WhatsAppService } from '@/src/application/services/whatsapp.service'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ConfirmDeleteDialog } from '@/src/components/ui/dialog/confirm-delete-dialog'
import { NotesDialog } from '@/src/components/ui/dialog/notes-dialog'
import { WhatsAppSummaryDialog } from '@/src/components/ui/dialog/whatsapp-summary-dialog'
import { Text } from '@/src/components/ui/text'
import { WorkOrderCard } from '@/src/components/ui/work-order-card'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { UUID } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import {
  Copy,
  Edit,
  LucideIcon,
  Package,
  Plus,
  Receipt,
  ReceiptText,
  Trash2,
} from 'lucide-react-native'
import * as React from 'react'
import { useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function WorkOrdersScreen() {
  const { createdWorkOrderId } = useLocalSearchParams<{
    createdWorkOrderId?: string
  }>()

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
    isExpired?: string
    isCopied?: string
  }>()

  const filters = {
    search: params.search,
    phoneNumber: params.phoneNumber,
    landlineNumber: params.landlineNumber,
    isWhatsApp: params.isWhatsApp,
    scheduledDate: params.scheduledDate,
    visitDate: params.visitDate,
    minTotalValue: params.minTotalValue,
    maxTotalValue: params.maxTotalValue,
    isPaid: params.isPaid,
    hasPayment: params.hasPayment,
    hasResult: params.hasResult,
    isExpired: params.isExpired,
    isCopied: params.isCopied,
  }

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useWorkOrdersInfinite(filters)
  const { mutate: deleteWorkOrder } = workOrderHooks.deleteWorkOrder()
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

  // Combina todas as páginas de work orders em um único array
  const allWorkOrders = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.data)
  }, [data])

  // Detectar quando uma work order foi criada e mostrar o dialog do WhatsApp
  React.useEffect(() => {
    if (createdWorkOrderId && allWorkOrders) {
      setShowWhatsAppDialog(true)
    }
  }, [createdWorkOrderId, allWorkOrders])

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
    if (workOrder.status !== 'EXPIRED' && workOrder.status !== 'COPIED') {
      options.push({
        label: 'Editar Cabeçalho da Ordem',
        icon: Edit,
        onPress: () => {
          router.push(`/work-orders/${workOrder.id}/edit`)
        },
      })
    }

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

    // Grupo: Pagamento
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

    // Clonar (se tiver resultado e pagamento OU se for EXPIRED)
    if (
      (workOrder.result && workOrder.paymentOrder) ||
      workOrder.status === 'EXPIRED'
    ) {
      options.push({
        label: 'Clonar Ordem de Serviço',
        icon: Copy,
        onPress: () => {
          router.push(`/work-orders/${workOrder.id}/clone`)
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
    if (!createdWorkOrderId || !allWorkOrders) {
      setShowWhatsAppDialog(false)
      router.setParams({ createdWorkOrderId: undefined })
      router.navigate('/work-orders', { dangerouslySingular: true })
      return
    }

    try {
      // Buscar a work order criada
      const workOrder = allWorkOrders.find((wo) => wo.id === createdWorkOrderId)

      if (!workOrder) {
        throw new Error('Ordem de serviço não encontrada')
      }

      // Enviar mensagem via WhatsApp
      WhatsAppService.sendWorkOrderMessage(workOrder, false)

      setShowWhatsAppDialog(false)
      router.setParams({ createdWorkOrderId: undefined })
      router.navigate('/work-orders', { dangerouslySingular: true })
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      Toast.show({
        type: 'error',
        text1: 'Erro ao enviar mensagem',
        text2: error instanceof Error ? error.message : 'Erro desconhecido',
      })
      setShowWhatsAppDialog(false)
      router.setParams({ createdWorkOrderId: undefined })
      router.navigate('/work-orders', { dangerouslySingular: true })
    }
  }

  // Função para cancelar o envio do WhatsApp
  const handleCancelWhatsApp = () => {
    setShowWhatsAppDialog(false)
    router.setParams({ createdWorkOrderId: undefined })
    router.navigate('/work-orders', { dangerouslySingular: true })
  }

  // Os dados já vêm filtrados do servidor via repository
  const displayedWorkOrders = allWorkOrders

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
    !!params.hasResult ||
    !!params.isExpired ||
    !!params.isCopied

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
    if (params.isExpired) {
      filters.push({
        label: 'Ordem Expirada',
        value: params.isExpired === 'true' ? 'Sim' : 'Não',
      })
    }
    if (params.isCopied) {
      filters.push({
        label: 'Ordem Clonada',
        value: params.isCopied === 'true' ? 'Sim' : 'Não',
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
    params.isExpired,
    params.isCopied,
  ])

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const renderFooter = () => {
    if (!isFetchingNextPage) return <View className="h-4" />
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" />
        <Text className="text-sm text-muted-foreground mt-2">
          Carregando mais ordens...
        </Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4">Carregando ordens de serviço...</Text>
      </SafeAreaView>
    )
  }

  const totalWorkOrders = data?.pages[0]?.totalCount ?? 0

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
      {totalWorkOrders === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhuma ordem de serviço cadastrada.{' \n'}
            Clique no + para adicionar.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <ActiveFiltersBanner
            filters={activeFilters}
            clearFiltersHref="/work-orders"
          />
          {displayedWorkOrders.length === 0 ? (
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-center text-muted-foreground">
                Nenhuma ordem encontrada com os filtros aplicados.
              </Text>
            </View>
          ) : (
            <View className="flex-1 px-4">
              <FlashList
                data={displayedWorkOrders}
                renderItem={({ item }) => (
                  <WorkOrderCard
                    wo={item as WorkOrder}
                    onPress={() => handleWorkOrderOptions(item as WorkOrder)}
                  />
                )}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
              />
            </View>
          )}

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
        </View>
      )}
    </SafeAreaView>
  )
}
