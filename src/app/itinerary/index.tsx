import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonFinish } from '@/src/components/ui/button-finish'
import { ButtonNew } from '@/src/components/ui/button-new'
import { DragToggleButton } from '@/src/components/ui/drag-toggle-button'
import { Text } from '@/src/components/ui/text'
import { Stack } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { Pressable, View } from 'react-native'
import DraggableFlatList from 'react-native-draggable-flatlist'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function ItineraryScreen() {
  const [isDragging, setIsDragging] = useState(false)
  const itinerary = true // TODO: fetch itinerary data here
  const [workOrders, setWorkOrders] = useState(
    [...Array(30)].map((_, index) => ({ id: `item-${index}`, index }))
  ) // TODO: fetch work orders data here

  const renderItem = useCallback(
    ({ item, drag, isActive }: any) => {
      const animatedStyle = useAnimatedStyle(() => {
        return {
          transform: [
            {
              scale: withSpring(isActive ? 1.05 : 1, {
                stiffness: 1000,
              }),
            },
          ],
        }
      })

      return (
        <AnimatedPressable
          onLongPress={isDragging ? drag : undefined}
          disabled={!isDragging || isActive}
          style={animatedStyle}
          className={`w-full rounded-lg ${
            isActive ? 'bg-primary/20' : 'bg-secondary/10'
          }`}
        >
          <View className="p-4">
            <Text>Item do Itinerário {item.index + 1}</Text>
          </View>
        </AnimatedPressable>
      )
    },
    [isDragging]
  )

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1">
        <Stack.Screen
          options={{
            headerTitle: 'Itinerário',
            headerRight: () => (
              <View className="flex-row gap-2">
                <ButtonFilter
                  href={{
                    pathname: '/itinerary/search',
                    params: {}, // TODO: put params with current filters here
                  }}
                  isActive={false} // TODO: put hasActiveFilters logic here
                />
                {itinerary ? (
                  <ButtonFinish href="/itinerary/finish" />
                ) : (
                  <ButtonNew href="/itinerary/form" />
                )}
              </View>
            ),
          }}
        />
        {!itinerary ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-muted-foreground">
              Nenhum Itinerário sendo utilizado.{' \n'}
              Clique no + para fazer um novo.
            </Text>
          </View>
        ) : (
          <>
            <Text className="font-bold text-center border-b border-border pb-2">
              Itinerário XX/XX/XXXX - XX/XX/XXXX
            </Text>

            {workOrders.length === 0 ? (
              <View className="flex-1 items-center justify-center px-4">
                <Text className="text-center text-muted-foreground">
                  Há algo errado!{'\n'}
                  Nenhuma ordem de serviço encontrada{'\n'}
                  no período escolhido.
                </Text>
              </View>
            ) : (
              <DraggableFlatList
                data={workOrders}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => {
                  setWorkOrders(data)
                  console.log('New order:', data)
                }}
                ListFooterComponent={<View className="h-16" />}
                activationDistance={10}
                containerStyle={{ backgroundColor: 'transparent' }}
                animationConfig={{ damping: 20, mass: 0.5, stiffness: 500 }}
              />
            )}

            <DragToggleButton onPress={() => setIsDragging(!isDragging)} />
          </>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}
