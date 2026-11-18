import { itineraryWorkOrderHooks } from '@/src/application/hooks/itinerary-work-order.hooks'
import { itineraryHooks } from '@/src/application/hooks/itinerary.hooks'
import { Button } from '@/src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Icon } from '@/src/components/ui/icon'
import { InlineSearchBar } from '@/src/components/ui/inline-search-bar'
import { Text } from '@/src/components/ui/text'
import { WorkOrderCard } from '@/src/components/ui/work-order-card'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { countCalendarDays, smartSearch, UUID } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Calendar, Clock, MapPin, Search, X } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ItineraryDetailsScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()

  const { data: itinerary, isLoading } = itineraryHooks.getItinerary(params.id)
  const { data: workOrders } =
    itineraryWorkOrderHooks.getItineraryWorkOrdersByItineraryId(
      params.id || ('' as UUID)
    )

  const [searchOpen, setSearchOpen] = useState(false)
  const [term, setTerm] = useState('')

  // Local, accent-insensitive filter over the itinerary's work orders (they
  // are already loaded for this screen)
  const visibleWorkOrders = useMemo(() => {
    if (!workOrders || !term) return workOrders ?? []
    return workOrders.filter(({ workOrder: wo }) =>
      [
        wo.customer.storeName,
        wo.customer.contactName,
        wo.customer.phoneNumber?.value,
        wo.customer.landlineNumber?.value,
      ].some((field) => field && smartSearch(field, term))
    )
  }, [workOrders, term])

  const toggleSearch = useCallback(() => {
    setSearchOpen((open) => {
      if (open) setTerm('')
      return !open
    })
  }, [])

  if (isLoading) {
    return (
      <SafeAreaView
        edges={['left', 'right']}
        className="flex-1 items-center justify-center"
      >
        <Text>Carregando itinerário...</Text>
      </SafeAreaView>
    )
  }

  if (!itinerary) {
    return (
      <SafeAreaView
        edges={['left', 'right']}
        className="flex-1 items-center justify-center"
      >
        <Text>Itinerário não encontrado.</Text>
      </SafeAreaView>
    )
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleWorkOrderPress = (workOrder: WorkOrder) => {
    router.push(`/work-orders/${workOrder.id}/details`)
  }

  return (
    <SafeAreaView edges={['left', 'right']} className="flex-1">
      <Stack.Screen
        options={{
          title: 'Detalhes do Itinerário',
          headerRight: () => (
            <Button
              size="icon"
              variant={searchOpen ? 'secondary' : 'outline'}
              onPress={toggleSearch}
              accessibilityLabel={
                searchOpen ? 'Fechar pesquisa' : 'Pesquisar ordens de serviço'
              }
            >
              <Icon as={searchOpen ? X : Search} size={20} />
            </Button>
          ),
        }}
      />
      {searchOpen && (
        <View className="px-4 pt-4">
          <InlineSearchBar
            value={term}
            onSearch={setTerm}
            placeholder="Pesquisar por cliente, contato ou telefone..."
            debounceMs={150}
            autoFocus
          />
        </View>
      )}

      {/* The summary scrolls with the list (it used to be fixed and leave
          only half of the screen for the work orders) */}
      <FlashList
        data={visibleWorkOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>
                  {itinerary.isFinished
                    ? 'Itinerário Finalizado'
                    : 'Itinerário'}
                </CardTitle>
                <CardDescription>
                  {formatDate(itinerary.initialItineraryDate)} -{' '}
                  {formatDate(itinerary.finalItineraryDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-3">
                <View className="flex-row items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">
                    Período:{' '}
                    {countCalendarDays(
                      new Date(itinerary.initialItineraryDate),
                      new Date(itinerary.finalItineraryDate)
                    )}{' '}
                    dia(s)
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  <MapPin size={16} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">
                    Ordens de serviço: {itinerary.totalOrders}
                  </Text>
                </View>

                {itinerary.isFinished && (
                  <View className="flex-row items-center gap-2">
                    <Clock size={16} className="text-muted-foreground" />
                    <Text className="text-sm text-muted-foreground">
                      Finalizadas: {itinerary.finishedOrders} /{' '}
                      {itinerary.totalOrders}
                    </Text>
                  </View>
                )}

                {itinerary.lateOrders.length > 0 && (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm text-warning">
                      Ordens atrasadas: {itinerary.lateOrders.length}
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>
            <Text className="text-lg font-semibold mb-3">
              Ordens de Serviço (
              {term
                ? `${visibleWorkOrders.length} de ${workOrders?.length || 0}`
                : workOrders?.length || 0}
              )
            </Text>
          </>
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-muted-foreground">
              {term
                ? 'Nenhuma ordem de serviço encontrada'
                : 'Nenhuma ordem de serviço neste itinerário'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <WorkOrderCard
            wo={item.workOrder}
            onPress={() => handleWorkOrderPress(item.workOrder)}
            isLate={item.isLate}
          />
        )}
        ListFooterComponent={<View className="h-4" />}
      />
    </SafeAreaView>
  )
}
