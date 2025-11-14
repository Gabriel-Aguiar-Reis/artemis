import { itineraryHooks } from '@/src/application/hooks/itinerary.hooks'
import { MapsService } from '@/src/application/services/maps'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { Stack } from 'expo-router'
import { ArrowDown, ArrowUp, MapPin, Navigation } from 'lucide-react-native'
import * as React from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ItineraryScreen() {
  const { data: activeItinerary, isLoading } =
    itineraryHooks.getActiveItinerary()
  const { mutate: updateItinerary } = itineraryHooks.updateItinerary()
  const { mutate: updateFinishItinerary } = itineraryHooks.updateItinerary()

  const handleOptimize = () => {
    if (!activeItinerary) return
    activeItinerary.optimizeRoute()
    updateItinerary({
      id: activeItinerary.id,
      workOrdersMap: activeItinerary.workOrdersMap.map((item) => item.toDTO()),
      initialItineraryDate: activeItinerary.initialItineraryDate.toISOString(),
      finalItineraryDate: activeItinerary.finalItineraryDate.toISOString(),
      isFinished: activeItinerary.isFinished,
    })
    alert('Rota otimizada!')
  }

  const handleOpenMaps = () => {
    if (!activeItinerary || activeItinerary.workOrdersMap.length === 0) {
      alert('Adicione ordens de serviço ao itinerário')
      return
    }
    try {
      MapsService.openGoogleMapsRoute(activeItinerary.workOrdersMap)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleOpenPartialMaps = (startIndex: number, endIndex: number) => {
    if (!activeItinerary) return
    try {
      MapsService.openGoogleMapsRoute(
        activeItinerary.workOrdersMap.slice(startIndex, endIndex + 1)
      )
    } catch (error: any) {
      alert(error.message)
    }
  }

  const moveUp = (position: number) => {
    if (!activeItinerary || position <= 1) return

    const items = [...activeItinerary.workOrdersMap]
    const currentIndex = position - 1
    const targetIndex = currentIndex - 1

    // Swap
    const temp = items[currentIndex]
    items[currentIndex] = items[targetIndex]
    items[targetIndex] = temp

    // Atualizar posições
    items.forEach((item, index) => {
      item.position = index + 1
    })

    updateItinerary({
      id: activeItinerary.id,
      workOrdersMap: items.map((item) => item.toDTO()),
      initialItineraryDate: activeItinerary.initialItineraryDate.toISOString(),
      finalItineraryDate: activeItinerary.finalItineraryDate.toISOString(),
      isFinished: activeItinerary.isFinished,
    })
  }

  const moveDown = (position: number) => {
    if (!activeItinerary || position >= activeItinerary.workOrdersMap.length)
      return

    const items = [...activeItinerary.workOrdersMap]
    const currentIndex = position - 1
    const targetIndex = currentIndex + 1

    // Swap
    const temp = items[currentIndex]
    items[currentIndex] = items[targetIndex]
    items[targetIndex] = temp

    // Atualizar posições
    items.forEach((item, index) => {
      item.position = index + 1
    })

    updateItinerary({
      id: activeItinerary.id,
      workOrdersMap: items.map((item) => item.toDTO()),
      initialItineraryDate: activeItinerary.initialItineraryDate.toISOString(),
      finalItineraryDate: activeItinerary.finalItineraryDate.toISOString(),
      isFinished: activeItinerary.isFinished,
    })
  }

  const handleFinish = () => {
    if (!activeItinerary) return
    try {
      activeItinerary.finish()
      updateFinishItinerary({
        id: activeItinerary.id,
        workOrdersMap: activeItinerary.workOrdersMap.map((item) =>
          item.toDTO()
        ),
        initialItineraryDate:
          activeItinerary.initialItineraryDate.toISOString(),
        finalItineraryDate: activeItinerary.finalItineraryDate.toISOString(),
        isFinished: true, // Marcado como finalizado
      })
      alert('Itinerário finalizado!')
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando itinerário...</Text>
      </SafeAreaView>
    )
  }

  if (!activeItinerary) {
    return (
      <SafeAreaView className="flex-1">
        <Stack.Screen options={{ title: 'Itinerário' }} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center text-muted-foreground">
            Nenhum itinerário ativo no momento.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: 'Itinerário' }} />
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          <View className="rounded-lg border border-border bg-card p-4">
            <Text className="mb-2 text-lg font-semibold">
              Resumo do Itinerário
            </Text>
            <Text className="text-sm">
              Progresso: {activeItinerary.progress}
            </Text>
            <Text className="text-sm">
              Distância total: {activeItinerary.getTotalDistance().toFixed(2)}{' '}
              km
            </Text>
            <Text className="text-sm">
              Ordens atrasadas: {activeItinerary.lateOrders.length}
            </Text>
            <Text className="text-sm">
              Status:{' '}
              {activeItinerary.isFinished ? 'Finalizado' : 'Em andamento'}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Button onPress={handleOptimize} className="flex-1">
              <Text>Otimizar Rota</Text>
            </Button>
            <Button
              onPress={handleOpenMaps}
              variant="outline"
              className="flex-1"
            >
              <Navigation size={20} />
              <Text className="ml-2">Abrir no Maps</Text>
            </Button>
          </View>

          {!activeItinerary.isFinished && (
            <Button onPress={handleFinish} variant="destructive">
              <Text>Finalizar Itinerário</Text>
            </Button>
          )}

          <Text className="mt-4 text-lg font-semibold">Ordens de Serviço</Text>

          {activeItinerary.workOrdersMap.length === 0 ? (
            <View className="items-center rounded-lg border border-border bg-card py-12">
              <Text className="text-center text-muted-foreground">
                Nenhuma ordem no itinerário
              </Text>
            </View>
          ) : (
            activeItinerary.workOrdersMap.map((item, index) => (
              <View
                key={item.workOrder.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <View className="mb-2 flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold">
                      #{item.position} - {item.workOrder.customer.storeName}
                    </Text>
                    {item.isLate && (
                      <Text className="mt-1 text-sm text-red-600">
                        ⚠️ Atrasado
                      </Text>
                    )}
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => moveUp(item.position)}>
                      <ArrowUp
                        size={20}
                        color={item.position === 1 ? '#ccc' : '#000'}
                      />
                    </Pressable>
                    <Pressable onPress={() => moveDown(item.position)}>
                      <ArrowDown
                        size={20}
                        color={
                          item.position === activeItinerary.workOrdersMap.length
                            ? '#ccc'
                            : '#000'
                        }
                      />
                    </Pressable>
                  </View>
                </View>

                <Text className="text-sm text-muted-foreground">
                  {item.workOrder.scheduledDate.toLocaleString('pt-BR')}
                </Text>
                <Text className="mt-1 text-sm">
                  {item.workOrder.customer.storeAddress.streetName},{' '}
                  {item.workOrder.customer.storeAddress.streetNumber}
                </Text>

                {index < activeItinerary.workOrdersMap.length - 1 && (
                  <View className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => handleOpenPartialMaps(index, index + 1)}
                    >
                      <MapPin size={16} />
                      <Text className="ml-1 text-xs">Rota até próximo</Text>
                    </Button>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
