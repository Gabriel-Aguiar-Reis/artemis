import { itineraryWorkOrderHooks } from '@/src/application/hooks/itinerary-work-order.hooks'
import { itineraryHooks } from '@/src/application/hooks/itinerary.hooks'
import { Button } from '@/src/components/ui/button'
import { ReorderWorkOrderCard } from '@/src/components/ui/reorder-work-order-card'
import { Text } from '@/src/components/ui/text'
import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { UUID } from '@/src/lib/utils'
import { Stack, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ListRenderItemInfo, View } from 'react-native'
import { GestureHandlerRootView, Pressable } from 'react-native-gesture-handler'
import ReorderableList, {
  ReorderableListReorderEvent,
  reorderItems,
  useReorderableDrag,
} from 'react-native-reorderable-list'
import { SafeAreaView } from 'react-native-safe-area-context'

// Componente extraído e memoizado para reordenação
// IMPORTANTE: Deve estar FORA do componente pai para memoização funcionar corretamente
const DraggableCard = React.memo<{ item: ItineraryWorkOrder }>(
  ({ item }) => {
    const drag = useReorderableDrag()
    return (
      <View className="px-4">
        <Pressable onLongPress={drag}>
          {/* Card otimizado para reordenação - sem Tooltips e estruturas complexas */}
          <ReorderWorkOrderCard wo={item.workOrder} isLate={item.isLate} />
        </Pressable>
      </View>
    )
  },
  (prevProps, nextProps) => {
    // Comparação otimizada: só re-renderiza se o item mudar
    return prevProps.item.id === nextProps.item.id
  }
)

DraggableCard.displayName = 'DraggableCard'

export default function ItineraryReorderScreen() {
  const router = useRouter()

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

  const handleReorder = useCallback(
    ({ from, to }: ReorderableListReorderEvent) => {
      setListData((value) => reorderItems(value, from, to))
    },
    []
  )

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ItineraryWorkOrder>) => {
      return <DraggableCard item={item} />
    },
    []
  )

  const handleSave = useCallback(async () => {
    const updates = listData.map((item, index) => ({
      id: item.id,
      position: index + 1,
    }))
    try {
      await (updatePositions as any)([updates])
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
