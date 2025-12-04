import { itineraryWorkOrderHooks } from '@/src/application/hooks/itinerary-work-order.hooks'
import { itineraryHooks } from '@/src/application/hooks/itinerary.hooks'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { WorkOrderCard } from '@/src/components/ui/work-order-card'
import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { UUID } from '@/src/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Stack, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

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

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ItineraryWorkOrder>) => {
      const animatedStyle = useAnimatedStyle(() => {
        return {
          transform: [
            {
              scale: withSpring(isActive ? 1.03 : 1, { stiffness: 500 }),
            },
          ],
          opacity: withSpring(isActive ? 0.95 : 1),
        }
      })

      return (
        <AnimatedPressable onLongPress={drag} style={animatedStyle}>
          <View className="px-4">
            <WorkOrderCard wo={item.workOrder} />
          </View>
        </AnimatedPressable>
      )
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
          <DraggableFlatList
            data={listData}
            onDragEnd={({ data }) => setListData(data)}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={<View className="h-4" />}
            ListFooterComponent={<View className="h-16" />}
            activationDistance={20}
            animationConfig={{ damping: 20, mass: 0.5, stiffness: 500 }}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}
