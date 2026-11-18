import { usePersistedTabFilters } from '@/src/application/hooks/use-persisted-tab-filters'
import { usePullToRefresh } from '@/src/application/hooks/use-pull-to-refresh'
import {
  useWorkOrderMonthCounts,
  useWorkOrdersInfinite,
} from '@/src/application/hooks/use-work-orders-infinite'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { WhatsAppService } from '@/src/application/services/whatsapp.service'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import {
  BackToTopButton,
  useBackToTop,
} from '@/src/components/ui/back-to-top-button'
import { Button } from '@/src/components/ui/button'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ConfirmDeleteDialog } from '@/src/components/ui/dialog/confirm-delete-dialog'
import { NotesDialog } from '@/src/components/ui/dialog/notes-dialog'
import { WhatsAppSummaryDialog } from '@/src/components/ui/dialog/whatsapp-summary-dialog'
import { Icon } from '@/src/components/ui/icon'
import { InlineSearchBar } from '@/src/components/ui/inline-search-bar'
import { ErrorState, LoadingState } from '@/src/components/ui/list-states'
import { Text } from '@/src/components/ui/text'
import { WorkOrderCard } from '@/src/components/ui/work-order-card'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { formatDate } from '@/src/lib/format'
import {
  describeNextVisitPeriod,
  isNextVisitView,
  resolveNextVisitRange,
} from '@/src/lib/next-visit-period'
import { UUID } from '@/src/lib/utils'
import {
  describeScheduledPeriod,
  monthKey,
  monthLabel,
  resolveScheduledRange,
} from '@/src/lib/work-order-period'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import {
  Copy,
  Edit,
  LucideIcon,
  Package,
  Plus,
  Receipt,
  ReceiptText,
  Search as SearchIcon,
  Trash2,
} from 'lucide-react-native'
import * as React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

/** List rows: month headers ("2026-10") interleaved with work orders */
type Row = { type: 'month'; key: string } | { type: 'order'; wo: WorkOrder }

const keyExtractor = (row: Row) =>
  row.type === 'month' ? `month-${row.key}` : row.wo.id
const getItemType = (row: Row) => row.type

export default function WorkOrdersScreen() {
  const { createdWorkOrderId } = useLocalSearchParams<{
    createdWorkOrderId?: string
  }>()

  const params = useLocalSearchParams<{
    search?: string // customer store name or contact name
    phoneNumber?: string
    landlineNumber?: string
    isWhatsApp?: string
    scheduledDate?: string // legacy single day (persisted by 1.2.0)
    scheduledPeriod?: string
    scheduledFrom?: string
    scheduledTo?: string
    nextVisitPeriod?: string
    nextVisitFrom?: string
    nextVisitTo?: string
    hasNextVisit?: string
    visitDate?: string
    minTotalValue?: string
    maxTotalValue?: string
    isPaid?: string
    hasPayment?: string
    hasResult?: string
    isExpired?: string
    isCopied?: string
  }>()
  // Filters survive closing the app
  usePersistedTabFilters('work-orders', params)

  // Presets are relative ("this-month"): resolved on every render
  const scheduledRange = resolveScheduledRange(params)
  const nextVisitRange = resolveNextVisitRange(params)
  const filters = {
    search: params.search,
    phoneNumber: params.phoneNumber,
    landlineNumber: params.landlineNumber,
    isWhatsApp: params.isWhatsApp,
    scheduledFrom: scheduledRange?.from?.toISOString(),
    scheduledTo: scheduledRange?.to?.toISOString(),
    nextVisitFrom: nextVisitRange?.from?.toISOString(),
    nextVisitTo: nextVisitRange?.to?.toISOString(),
    hasNextVisit: params.hasNextVisit,
    visitDate: params.visitDate,
    minTotalValue: params.minTotalValue,
    maxTotalValue: params.maxTotalValue,
    isPaid: params.isPaid,
    hasPayment: params.hasPayment,
    hasResult: params.hasResult,
    isExpired: params.isExpired,
    isCopied: params.isCopied,
  }

  // On demand: with ~15k work orders, nothing is loaded until the user
  // searches or applies a filter (faster, and finds things quicker than
  // scrolling)
  const hasActiveFilters =
    !!params.search ||
    !!params.phoneNumber ||
    !!params.landlineNumber ||
    !!params.isWhatsApp ||
    !!scheduledRange ||
    !!nextVisitRange ||
    !!params.hasNextVisit ||
    !!params.visitDate ||
    !!params.minTotalValue ||
    !!params.maxTotalValue ||
    !!params.isPaid ||
    !!params.hasPayment ||
    !!params.hasResult ||
    !!params.isExpired ||
    !!params.isCopied

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useWorkOrdersInfinite(filters, { enabled: hasActiveFilters })
  const { data: monthCounts } = useWorkOrderMonthCounts(filters, {
    enabled: hasActiveFilters,
  })
  const { mutateAsync: deleteWorkOrder, isPending: isDeleting } =
    workOrderHooks.deleteWorkOrder()
  const { refreshing, onRefresh } = usePullToRefresh(refetch)
  const {
    listRef,
    isVisible: showScrollBtn,
    onScroll,
  } = useBackToTop<FlashListRef<Row>>()
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<{
    id: UUID
    customerName: string
    date: Date
    warning?: string
  } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<{
    title: string
    notes?: string
  } | null>(null)
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)

  // Combine all work order pages into a single array
  const allWorkOrders = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.data)
  }, [data])

  // Detect when a work order was created and show the WhatsApp dialog
  // Depends only on the created id: list refetches do not reopen the dialog.
  React.useEffect(() => {
    if (createdWorkOrderId) {
      setShowWhatsAppDialog(true)
    }
  }, [createdWorkOrderId])

  const handleWorkOrderOptions = useCallback(async (workOrder: WorkOrder) => {
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

    // Clone (if it has result and payment OR is EXPIRED)
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

    options.push({
      label: 'Excluir',
      icon: Trash2,
      destructive: true,
      onPress: () => {
        // Deleting also removes the report and payment: warn when there is
        // money received or a recorded visit.
        const warning = workOrder.paymentOrder?.isPaid
          ? 'Esta OS já foi paga: o pagamento recebido também será apagado.'
          : workOrder.result
            ? 'Esta OS já tem relatório de visita, que também será apagado.'
            : undefined
        setSelectedWorkOrder({
          id: workOrder.id,
          customerName,
          date: date!,
          warning,
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
  }, [])

  const handleDeleteWorkOrder = async (workOrderId: UUID) => {
    try {
      await deleteWorkOrder(workOrderId)
    } catch {
      // error toast comes from the hook
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  // Function to send the WhatsApp message
  const handleSendWhatsApp = async () => {
    if (!createdWorkOrderId) {
      setShowWhatsAppDialog(false)
      router.setParams({ createdWorkOrderId: undefined })
      router.navigate('/work-orders', { dangerouslySingular: true })
      return
    }

    try {
      // Fetch the created work order: first from the loaded list; if it is not on
      // the current page (or the list has not reloaded yet), straight from the database.
      const workOrder =
        allWorkOrders?.find((wo) => wo.id === createdWorkOrderId) ??
        (await workOrderHooks.getWorkOrderById(createdWorkOrderId as UUID))

      if (!workOrder) {
        throw new Error('Ordem de serviço não encontrada')
      }

      // Send message via WhatsApp
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

  // Function to cancel sending the WhatsApp message
  const handleCancelWhatsApp = () => {
    setShowWhatsAppDialog(false)
    router.setParams({ createdWorkOrderId: undefined })
    router.navigate('/work-orders', { dangerouslySingular: true })
  }

  // Grouped by scheduled month (the list is ordered by date desc, so each
  // month is contiguous); lets the user browse month by month. Browsing by
  // next visit is an agenda: soonest reminder first, grouped by its month.
  const byNextVisit = isNextVisitView(filters)
  const rows = useMemo(() => {
    const out: Row[] = []
    let current: string | undefined
    for (const wo of allWorkOrders) {
      const key = monthKey(
        byNextVisit ? (wo.nextVisitDate ?? wo.scheduledDate) : wo.scheduledDate
      )
      if (key !== current) {
        out.push({ type: 'month', key })
        current = key
      }
      out.push({ type: 'order', wo })
    }
    return out
  }, [allWorkOrders, byNextVisit])

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
    const period = describeScheduledPeriod(params)
    if (period) {
      filters.push({ label: 'Período', value: period })
    }
    const nextVisit = describeNextVisitPeriod(params)
    if (nextVisit) {
      filters.push({ label: 'Próxima visita', value: nextVisit })
    }
    if (params.hasNextVisit) {
      filters.push({
        label: 'Tem próxima visita',
        value: params.hasNextVisit === 'true' ? 'Sim' : 'Não',
      })
    }
    if (params.visitDate) {
      filters.push({
        label: 'Data de Visita',
        value: formatDate(new Date(params.visitDate)),
      })
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
    params.scheduledPeriod,
    params.scheduledFrom,
    params.scheduledTo,
    params.nextVisitPeriod,
    params.nextVisitFrom,
    params.nextVisitTo,
    params.hasNextVisit,
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

  const handleInlineSearch = useCallback((term: string) => {
    router.setParams({ search: term || undefined })
  }, [])

  // Relative presets: a filter restored on another day still means
  // "today"/"this month"
  const showPeriod = useCallback((scheduledPeriod: string) => {
    router.setParams({ scheduledPeriod })
  }, [])

  // Agenda of reminders: soonest first
  const showNextVisits = useCallback(() => {
    router.setParams({ hasNextVisit: 'true' })
  }, [])

  const showExpired = useCallback(() => {
    router.setParams({ isExpired: 'true' })
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      if (item.type === 'month') {
        const total = monthCounts?.[item.key]
        return (
          <View className="flex-row items-baseline justify-between pt-2 pb-3">
            <Text className="text-base font-semibold">
              {monthLabel(item.key)}
            </Text>
            {total !== undefined && (
              <Text className="text-sm text-muted-foreground">
                {total === 1 ? '1 ordem' : `${total} ordens`}
              </Text>
            )}
          </View>
        )
      }
      return <WorkOrderCard wo={item.wo} onOptions={handleWorkOrderOptions} />
    },
    [handleWorkOrderOptions, monthCounts]
  )

  // Loading/error only replace the list area: the search bar stays mounted,
  // otherwise it loses focus (and the keyboard closes) on every search
  const totalWorkOrders = data?.pages[0]?.totalCount ?? 0

  return (
    <SafeAreaView edges={['left', 'right']} className="flex-1">
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
      <View className="px-4 py-4 gap-3">
        <InlineSearchBar
          value={params.search ?? ''}
          onSearch={handleInlineSearch}
          placeholder="Pesquisar por cliente ou contato..."
        />
        {!hasActiveFilters && (
          <View className="flex-row flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => showPeriod('today')}
            >
              <Text>Agendadas hoje</Text>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => showPeriod('this-month')}
            >
              <Text>Este mês</Text>
            </Button>
            <Button size="sm" variant="secondary" onPress={showNextVisits}>
              <Text>Próximas visitas</Text>
            </Button>
            <Button size="sm" variant="secondary" onPress={showExpired}>
              <Text>Expiradas</Text>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => router.push('/work-orders/search')}
            >
              <Text>Mais filtros</Text>
            </Button>
          </View>
        )}
      </View>

      {!hasActiveFilters ? (
        <View className="flex-1 items-center justify-center px-8 gap-3">
          <Icon as={SearchIcon} size={40} className="text-muted-foreground" />
          <Text className="text-lg font-semibold text-center">
            Encontre uma ordem de serviço
          </Text>
          <Text className="text-center text-muted-foreground">
            Pesquise pelo cliente ou use os filtros. Para criar uma nova, toque
            no +.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <ActiveFiltersBanner
            filters={activeFilters}
            clearFiltersHref="/work-orders"
          />
          {!isLoading && !isError && (
            <Text className="px-4 pb-2 text-sm text-muted-foreground">
              {totalWorkOrders === 1
                ? '1 ordem encontrada'
                : `${totalWorkOrders} ordens encontradas`}
            </Text>
          )}
          {isLoading ? (
            <LoadingState label="Buscando ordens de serviço..." />
          ) : isError && !data ? (
            <ErrorState
              message="Não foi possível carregar as ordens de serviço."
              onRetry={() => refetch()}
            />
          ) : rows.length === 0 ? (
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-center text-muted-foreground">
                Nenhuma ordem encontrada com os filtros aplicados.
              </Text>
            </View>
          ) : (
            <View className="flex-1">
              <FlashList
                ref={listRef}
                data={rows}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                getItemType={getItemType}
                onScroll={onScroll}
                scrollEventThrottle={16}
                refreshing={refreshing}
                onRefresh={onRefresh}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
              />
              <BackToTopButton isVisible={showScrollBtn} scrollRef={listRef} />
            </View>
          )}
        </View>
      )}

      {selectedWorkOrder && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={`Excluir ordem de serviço do cliente "${selectedWorkOrder.customerName}"?`}
          warning={selectedWorkOrder.warning}
          isPending={isDeleting}
          handleDelete={() => handleDeleteWorkOrder(selectedWorkOrder.id)}
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
        onOpenChange={(open) => {
          setShowWhatsAppDialog(open)
          if (!open && createdWorkOrderId) {
            router.setParams({ createdWorkOrderId: undefined })
          }
        }}
        title="Enviar resumo ao cliente?"
        description="Deseja enviar via WhatsApp o resumo desta ordem de serviço?"
        onConfirm={handleSendWhatsApp}
        onCancel={handleCancelWhatsApp}
      />
    </SafeAreaView>
  )
}
