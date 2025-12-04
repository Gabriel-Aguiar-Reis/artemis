import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonFinish } from '@/src/components/ui/button-finish'
import { ButtonNew } from '@/src/components/ui/button-new'
import { DragToggleButton } from '@/src/components/ui/drag-toggle-button'
import { Text } from '@/src/components/ui/text'
import { Stack } from 'expo-router'
import React from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ItineraryScreen() {
  const itinerary = true // TODO: fetch itinerary data here
  const workOrders = [...Array(30)] // TODO: fetch work orders data here
  return (
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
            <ScrollView className="w-full pt-1">
              {workOrders.map((_, index) => (
                <View
                  key={index}
                  className="my-2 w-full rounded-lg bg-secondary/10"
                >
                  <Text>Item do Itinerário {index + 1}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <DragToggleButton />
        </>
      )}
    </SafeAreaView>
  )
}
