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
import { Text } from '@/src/components/ui/text'
import { UUID } from '@/src/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Stack, useRouter } from 'expo-router'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
} from 'lucide-react-native'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ItineraryFinishScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: itinerary, isLoading } = itineraryHooks.getActiveItinerary()
  const { data: itineraryWorkOrders } =
    itineraryWorkOrderHooks.getItineraryWorkOrdersByItineraryId(
      itinerary?.id || ('' as UUID)
    )

  const [isFinishing, setIsFinishing] = useState(false)

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!itineraryWorkOrders || !itinerary) {
      return {
        totalWorkOrders: 0,
        lateWorkOrders: 0,
        totalDays: 0,
        totalRevenue: 0,
        paidOrders: 0,
        unpaidOrders: 0,
        ordersWithResult: 0,
        ordersWithoutResult: 0,
      }
    }

    const totalWorkOrders = itineraryWorkOrders.length

    // Contar atrasadas
    const lateWorkOrders = itineraryWorkOrders.filter((iwo) => {
      const wo = iwo.workOrder
      if (!wo.visitDate) return false
      return wo.visitDate > wo.scheduledDate
    }).length

    // Calcular dias no período
    const diffTime = Math.abs(
      itinerary.finalItineraryDate.getTime() -
        itinerary.initialItineraryDate.getTime()
    )
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    // Calcular faturamento total
    const totalRevenue = itineraryWorkOrders.reduce((acc, iwo) => {
      if (iwo.workOrder.paymentOrder) {
        return acc + iwo.workOrder.paymentOrder.totalValue
      }
      return acc
    }, 0)

    // Contar pagas/não pagas
    const paidOrders = itineraryWorkOrders.filter(
      (iwo) => iwo.workOrder.paymentOrder?.isPaid
    ).length
    const unpaidOrders = itineraryWorkOrders.filter(
      (iwo) => iwo.workOrder.paymentOrder && !iwo.workOrder.paymentOrder.isPaid
    ).length

    // Contar com/sem resultado
    const ordersWithResult = itineraryWorkOrders.filter(
      (iwo) => iwo.workOrder.result
    ).length
    const ordersWithoutResult = totalWorkOrders - ordersWithResult

    return {
      totalWorkOrders,
      lateWorkOrders,
      totalDays,
      totalRevenue,
      paidOrders,
      unpaidOrders,
      ordersWithResult,
      ordersWithoutResult,
    }
  }, [itineraryWorkOrders, itinerary])

  const handleFinish = async () => {
    if (!itinerary) return
    setIsFinishing(true)
    try {
      await itineraryHooks.finishItinerary(itinerary.id)

      queryClient.removeQueries({ queryKey: ['itineraryWorkOrders'] })
      queryClient.removeQueries({ queryKey: ['itineraries'] })
      queryClient.removeQueries({ queryKey: ['itinerary', itinerary.id] })
      queryClient.removeQueries({ queryKey: ['workOrders'] })

      router.replace('/itinerary')
    } catch (error) {
      console.error('Erro ao finalizar itinerário:', error)
    } finally {
      setIsFinishing(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: 'Finalizar Itinerário' }} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center px-4">
          <ActivityIndicator size="large" />
          <Text className="text-center text-muted-foreground mt-2">
            Carregando itinerário...
          </Text>
        </View>
      ) : !itinerary ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhum itinerário ativo encontrado
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          <View className="p-4 gap-4">
            {/* Header com informação do período */}
            <Card>
              <CardHeader>
                <CardTitle>Itinerário a Finalizar</CardTitle>
                <CardDescription>
                  {itinerary.initialItineraryDate.toLocaleDateString('pt-BR')} -{' '}
                  {itinerary.finalItineraryDate.toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Itinerário</CardTitle>
                <CardDescription>
                  Informações sobre as ordens de serviço executadas
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-4">
                {/* Total de ordens */}
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary/10 p-3 rounded-full">
                    <Icon
                      as={FileText}
                      size={20}
                      className="text-primary"
                      strokeWidth={2}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-muted-foreground">
                      Total de Ordens de Serviço
                    </Text>
                    <Text className="text-2xl font-semibold">
                      {stats.totalWorkOrders}
                    </Text>
                  </View>
                </View>

                {/* Ordens atrasadas */}
                <View className="flex-row items-center gap-3">
                  <View
                    className={`p-3 rounded-full ${stats.lateWorkOrders > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}
                  >
                    {stats.lateWorkOrders > 0 ? (
                      <Icon
                        as={AlertCircle}
                        size={20}
                        className="text-destructive"
                        strokeWidth={2}
                      />
                    ) : (
                      <Icon
                        as={CheckCircle}
                        size={20}
                        className="text-primary"
                        strokeWidth={2}
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-muted-foreground">
                      Ordens Atrasadas
                    </Text>
                    <Text
                      className={`text-2xl font-semibold ${stats.lateWorkOrders > 0 ? 'text-destructive' : ''}`}
                    >
                      {stats.lateWorkOrders}
                    </Text>
                  </View>
                </View>

                {/* Dias no período */}
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary/10 p-3 rounded-full">
                    <Icon
                      as={Calendar}
                      size={20}
                      className="text-primary"
                      strokeWidth={2}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-muted-foreground">
                      Dias no Período
                    </Text>
                    <Text className="text-2xl font-semibold">
                      {stats.totalDays}
                    </Text>
                  </View>
                </View>

                {/* Faturamento total */}
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary/10 p-3 rounded-full">
                    <Icon
                      as={DollarSign}
                      size={20}
                      className="text-primary"
                      strokeWidth={2}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-muted-foreground">
                      Faturamento Total
                    </Text>
                    <Text className="text-2xl font-semibold">
                      R${' '}
                      {stats.totalRevenue.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </View>

                {/* Ordens com resultado */}
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary/10 p-3 rounded-full">
                    <Icon
                      as={FileText}
                      size={20}
                      className="text-primary"
                      strokeWidth={2}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-muted-foreground">
                      Com Relatório / Sem Relatório
                    </Text>
                    <Text className="text-2xl font-semibold">
                      {stats.ordersWithResult} / {stats.ordersWithoutResult}
                    </Text>
                  </View>
                </View>

                {/* Pagamento */}
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary/10 p-3 rounded-full">
                    <Icon
                      as={DollarSign}
                      size={20}
                      className="text-primary"
                      strokeWidth={2}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-muted-foreground">
                      Pagas / Não Pagas
                    </Text>
                    <Text className="text-2xl font-semibold">
                      {stats.paidOrders} / {stats.unpaidOrders}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Alerta sobre finalização */}
            <Card className="bg-muted/50">
              <CardContent>
                <View className="flex-row gap-3">
                  <Icon
                    as={Clock}
                    size={20}
                    className="text-muted-foreground mt-0.5"
                  />
                  <View className="flex-1">
                    <Text className="text-sm text-muted-foreground">
                      Ao finalizar este itinerário, os atrasos (se houver) serão
                      registrados permanentemente e não será mais possível
                      editá-lo.
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <View className="gap-3 pb-4">
              <Button onPress={handleFinish} disabled={isFinishing}>
                {isFinishing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-primary-foreground font-medium">
                    Finalizar Itinerário
                  </Text>
                )}
              </Button>
              <Button
                variant="outline"
                onPress={handleCancel}
                disabled={isFinishing}
              >
                <Text>Cancelar</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
