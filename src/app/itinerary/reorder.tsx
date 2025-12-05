import { itineraryWorkOrderHooks } from '@/src/application/hooks/itinerary-work-order.hooks'
import { itineraryHooks } from '@/src/application/hooks/itinerary.hooks'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { WorkOrderCard } from '@/src/components/ui/work-order-card'
import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { UUID } from '@/src/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Stack, useRouter } from 'expo-router'
import React, { FC, useCallback, useEffect, useState } from 'react'
import { ListRenderItemInfo, View } from 'react-native'
import { GestureHandlerRootView, Pressable } from 'react-native-gesture-handler'
import ReorderableList, {
  ReorderableListReorderEvent,
  reorderItems,
  useReorderableDrag,
} from 'react-native-reorderable-list'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ItineraryReorderScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: itinerary, isLoading } = itineraryHooks.getActiveItinerary()
  const { mutateAsync: updatePositions } =
    itineraryWorkOrderHooks.updatePositions()
  const { data: workOrders } =
    itineraryWorkOrderHooks.getItineraryWorkOrdersByItineraryId(
      itinerary?.id || ('' as UUID)
    )

  const [listData, setListData] = useState<ItineraryWorkOrder[]>([])

  useEffect(() => {
    if (workOrders && Array.isArray(workOrders)) {
      setListData(workOrders)
    }
  }, [workOrders])

  const handleReorder = ({ from, to }: ReorderableListReorderEvent) => {
    setListData((value) => reorderItems(value, from, to))
  }

  const Card: FC<{ item: ItineraryWorkOrder }> = ({ item }) => {
    const drag = useReorderableDrag()
    return (
      <Pressable onLongPress={drag}>
        <WorkOrderCard wo={item.workOrder} isLate={item.isLate} />
      </Pressable>
    )
  }
  const renderItem = ({ item }: ListRenderItemInfo<ItineraryWorkOrder>) => {
    return (
      <View className="px-4">
        <Card item={item} />
      </View>
    )
  }

  const handleSave = useCallback(async () => {
    const updates = listData.map((item, index) => ({
      id: item.id,
      position: index + 1,
    }))
    try {
      await (updatePositions as any)([updates])
      queryClient.invalidateQueries({ queryKey: ['itineraryWorkOrders'] })
      queryClient.invalidateQueries({ queryKey: ['itineraries'] })
      router.back()
    } catch (err) {
      console.error('Falha ao salvar nova ordenação:', err)
    }
  }, [listData, updatePositions, router])

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1">
        <Stack.Screen
          options={{
            headerTitle: 'Ordenar Itinerário',
            headerRight: () => (
              <View className="flex-row gap-2">
                <Button onPress={handleSave}>
                  <Text className="font-medium">Salvar</Text>
                </Button>
              </View>
            ),
          }}
        />

        {isLoading || !itinerary ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-muted-foreground">
              Carregando itinerário...
            </Text>
          </View>
        ) : (
          <ReorderableList
            data={listData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            onReorder={handleReorder}
            ListHeaderComponent={<View className="h-4" />}
            ListFooterComponent={<View className="h-16" />}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}
