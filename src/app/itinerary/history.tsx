import { itineraryHooks } from '@/src/application/hooks/itinerary.hooks'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import { Itinerary } from '@/src/domain/entities/itinerary/itinerary.entity'
import { FlashList } from '@shopify/flash-list'
import { Stack, useRouter } from 'expo-router'
import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
} from 'lucide-react-native'
import React, { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ItineraryHistoryScreen() {
  const router = useRouter()
  const { data: allItineraries, isLoading } = itineraryHooks.getItineraries()

  // Filtrar apenas itinerários finalizados e ordenar por data (mais recente primeiro)
  const finishedItineraries = useMemo(() => {
    if (!allItineraries) return []
    return allItineraries
      .filter((it) => it.isFinished)
      .sort(
        (a, b) =>
          b.finalItineraryDate.getTime() - a.finalItineraryDate.getTime()
      )
  }, [allItineraries])

  const handleItineraryPress = (itinerary: Itinerary) => {
    router.push(`/itinerary/${itinerary.id}/details`)
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: 'Histórico de Itinerários' }} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Carregando histórico...
          </Text>
        </View>
      ) : finishedItineraries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Icon
            as={Calendar}
            size={64}
            className="text-muted-foreground mb-4"
            strokeWidth={1.5}
          />
          <Text className="text-center text-muted-foreground text-lg mb-2">
            Nenhum Itinerário Finalizado
          </Text>
          <Text className="text-center text-muted-foreground text-sm">
            Os itinerários finalizados aparecerão aqui
          </Text>
        </View>
      ) : (
        <View className="flex-1 px-4">
          <FlashList
            data={finishedItineraries}
            renderItem={({ item }) => (
              <ItineraryCard
                itinerary={item}
                onPress={() => handleItineraryPress(item)}
              />
            )}
            ListHeaderComponent={<View className="h-4" />}
            ListFooterComponent={<View className="h-4" />}
          />
        </View>
      )}
    </SafeAreaView>
  )
}

type ItineraryCardProps = {
  itinerary: Itinerary
  onPress: () => void
}

function ItineraryCard({ itinerary, onPress }: ItineraryCardProps) {
  const stats = useMemo(() => {
    const totalWorkOrders = itinerary.workOrders.length
    const lateWorkOrders = itinerary.lateOrders.length

    const totalRevenue = itinerary.workOrders.reduce((acc, iwo) => {
      if (iwo.workOrder.paymentOrder) {
        return acc + iwo.workOrder.paymentOrder.totalValue
      }
      return acc
    }, 0)

    const ordersWithResult = itinerary.workOrders.filter(
      (iwo) => iwo.workOrder.result
    ).length

    const diffTime = Math.abs(
      itinerary.finalItineraryDate.getTime() -
        itinerary.initialItineraryDate.getTime()
    )
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    return {
      totalWorkOrders,
      lateWorkOrders,
      totalRevenue,
      ordersWithResult,
      totalDays,
    }
  }, [itinerary])

  return (
    <Pressable onPress={onPress} className="mb-3">
      <Card>
        <CardHeader>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <CardTitle className="text-base">
                {itinerary.initialItineraryDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                -{' '}
                {itinerary.finalItineraryDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </CardTitle>
              <CardDescription className="mt-1">
                {stats.totalDays} {stats.totalDays === 1 ? 'dia' : 'dias'} •{' '}
                {stats.totalWorkOrders}{' '}
                {stats.totalWorkOrders === 1 ? 'ordem' : 'ordens'}
              </CardDescription>
            </View>
            <Icon
              as={ChevronRight}
              size={20}
              className="text-muted-foreground"
            />
          </View>
        </CardHeader>
        <CardContent className="gap-3">
          {/* Faturamento */}
          <View className="flex-row items-center gap-2">
            <View className="bg-primary/10 p-2 rounded-full">
              <Icon
                as={DollarSign}
                size={16}
                className="text-primary"
                strokeWidth={2}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">Faturamento</Text>
              <Text className="text-sm font-semibold">
                R${' '}
                {stats.totalRevenue.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          {/* Estatísticas em linha */}
          <View className="flex-row gap-4">
            {/* Com Relatório */}
            <View className="flex-row items-center gap-2">
              <Icon
                as={FileText}
                size={16}
                className="text-muted-foreground"
                strokeWidth={2}
              />
              <Text className="text-xs text-muted-foreground">
                {stats.ordersWithResult} relatórios
              </Text>
            </View>

            {/* Atrasadas */}
            {stats.lateWorkOrders > 0 && (
              <View className="flex-row items-center gap-2">
                <Icon
                  as={Clock}
                  size={16}
                  className="text-destructive"
                  strokeWidth={2}
                />
                <Text className="text-xs text-destructive">
                  {stats.lateWorkOrders} atrasadas
                </Text>
              </View>
            )}

            {/* Todas no prazo */}
            {stats.lateWorkOrders === 0 && (
              <View className="flex-row items-center gap-2">
                <Icon
                  as={CheckCircle}
                  size={16}
                  className="text-green-600"
                  strokeWidth={2}
                />
                <Text className="text-xs text-green-600">Todas no prazo</Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  )
}
