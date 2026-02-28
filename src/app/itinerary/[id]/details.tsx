import { itineraryWorkOrderHooks } from '@/src/application/hooks/itinerary-work-order.hooks'
import { itineraryHooks } from '@/src/application/hooks/itinerary.hooks'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Text } from '@/src/components/ui/text'
import { WorkOrderCard } from '@/src/components/ui/work-order-card'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { UUID } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Calendar, Clock, MapPin } from 'lucide-react-native'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ItineraryDetailsScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()

  const { data: itinerary, isLoading } = itineraryHooks.getItinerary(params.id)
  const { data: workOrders } =
    itineraryWorkOrderHooks.getItineraryWorkOrdersByItineraryId(
      params.id || ('' as UUID)
    )

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando itinerário...</Text>
      </SafeAreaView>
    )
  }

  if (!itinerary) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
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
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Detalhes do Itinerário',
        }}
      />

      <View className="flex-1 p-4">
        {/* Card com informações do itinerário */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>
              {itinerary.isFinished ? 'Itinerário Finalizado' : 'Itinerário'}
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
                {Math.ceil(
                  (new Date(itinerary.finalItineraryDate).getTime() -
                    new Date(itinerary.initialItineraryDate).getTime()) /
                    (1000 * 60 * 60 * 24)
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
                <Text className="text-sm text-destructive">
                  Ordens atrasadas: {itinerary.lateOrders.length}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Lista de ordens de serviço */}
        <View className="flex-1">
          <Text className="text-lg font-semibold mb-3">
            Ordens de Serviço ({workOrders?.length || 0})
          </Text>

          {!workOrders || workOrders.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground">
                Nenhuma ordem de serviço neste itinerário
              </Text>
            </View>
          ) : (
            <FlashList
              data={workOrders}
              renderItem={({ item }) => (
                <WorkOrderCard
                  wo={item.workOrder}
                  onPress={() => handleWorkOrderPress(item.workOrder)}
                  isLate={item.isLate}
                />
              )}
              ListFooterComponent={<View className="h-4" />}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}
