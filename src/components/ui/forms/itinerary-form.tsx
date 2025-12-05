import { Button } from '@/src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { DatePickerRangeInput } from '@/src/components/ui/date-picker-range-input'
import { Text } from '@/src/components/ui/text'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import DrizzleWorkOrderRepository from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'
import { Stack } from 'expo-router'
import { Calendar, DollarSign, FileText } from 'lucide-react-native'
import React, { BaseSyntheticEvent, useEffect, useMemo, useState } from 'react'
import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
} from 'react-hook-form'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const workOrderRepo = new DrizzleWorkOrderRepository()

type ItineraryFormProps<T extends FieldValues> = {
  title: string
  onSubmit: (e?: BaseSyntheticEvent) => void
  errors: FieldErrors<T>
  control: Control<T>
  submitLabel: string
  loading?: boolean
  dateRangeName: Path<T>
}

export function ItineraryForm<T extends FieldValues>({
  title,
  onSubmit,
  errors,
  control,
  submitLabel,
  loading,
  dateRangeName,
}: ItineraryFormProps<T>) {
  const [selectedRange, setSelectedRange] = useState<{
    startDate: Date | undefined
    endDate: Date | undefined
  }>({
    startDate: undefined,
    endDate: undefined,
  })

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false)

  // Buscar work orders quando o range mudar
  useEffect(() => {
    if (selectedRange.startDate && selectedRange.endDate) {
      setLoadingWorkOrders(true)
      workOrderRepo
        .getWorkOrdersByDateRange(
          selectedRange.startDate,
          selectedRange.endDate
        )
        .then((data) => {
          setWorkOrders(data || [])
        })
        .catch((error) => {
          console.error('Erro ao buscar ordens de serviço:', error)
          setWorkOrders([])
        })
        .finally(() => {
          setLoadingWorkOrders(false)
        })
    } else {
      setWorkOrders([])
    }
  }, [selectedRange.startDate, selectedRange.endDate])

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!selectedRange.startDate || !selectedRange.endDate) {
      return {
        totalWorkOrders: 0,
        totalDays: 0,
        estimatedRevenue: 0,
      }
    }

    const totalWorkOrders = workOrders.length

    // Calcular dias no intervalo
    const diffTime = Math.abs(
      selectedRange.endDate.getTime() - selectedRange.startDate.getTime()
    )
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    // Calcular faturamento estimado baseado nos produtos agendados
    const estimatedRevenue = workOrders.reduce((acc, wo) => {
      // Prioriza o valor do pagamento se existir, senão usa o total dos produtos
      if (wo.paymentOrder) {
        return acc + wo.paymentOrder.totalValue
      }
      return acc + wo.totalAmountForProducts
    }, 0)

    return {
      totalWorkOrders,
      totalDays,
      estimatedRevenue,
    }
  }, [workOrders, selectedRange])

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title }} />
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          {/* Campo de seleção de período */}
          <Controller
            control={control}
            name={dateRangeName}
            render={({ field: { onChange, value } }) => (
              <DatePickerRangeInput
                value={value || selectedRange}
                onDateChange={(range) => {
                  setSelectedRange(range)
                  onChange(range)
                }}
                label="Período do Itinerário"
                placeholder="Selecione o período"
                error={
                  errors[dateRangeName]
                    ? String(errors[dateRangeName]?.message || 'Campo inválido')
                    : undefined
                }
              />
            )}
          />

          {/* Card de resumo */}
          {selectedRange.startDate && selectedRange.endDate && (
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Período</CardTitle>
                <CardDescription>
                  Informações sobre as ordens de serviço no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-4">
                {loadingWorkOrders ? (
                  <View className="py-8 items-center justify-center">
                    <ActivityIndicator size="large" />
                    <Text className="text-muted-foreground mt-2">
                      Carregando ordens de serviço...
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Quantidade de ordens de serviço */}
                    <View className="flex-row items-center gap-3">
                      <View className="bg-primary/10 p-3 rounded-full">
                        <FileText
                          size={20}
                          className="text-primary"
                          strokeWidth={2}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm text-muted-foreground">
                          Ordens de Serviço
                        </Text>
                        <Text className="text-2xl font-semibold">
                          {stats.totalWorkOrders}
                        </Text>
                      </View>
                    </View>

                    {/* Dias no período */}
                    <View className="flex-row items-center gap-3">
                      <View className="bg-primary/10 p-3 rounded-full">
                        <Calendar
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

                    {/* Faturamento estimado */}
                    <View className="flex-row items-center gap-3">
                      <View className="bg-primary/10 p-3 rounded-full">
                        <DollarSign
                          size={20}
                          className="text-primary"
                          strokeWidth={2}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm text-muted-foreground">
                          Faturamento Estimado
                        </Text>
                        <Text className="text-2xl font-semibold">
                          R${' '}
                          {stats.estimatedRevenue.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                    </View>

                    {stats.totalWorkOrders === 0 && (
                      <View className="py-4 items-center">
                        <Text className="text-muted-foreground text-center">
                          Nenhuma ordem de serviço encontrada para este período
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botão de submit */}
          <Button
            onPress={onSubmit}
            disabled={
              loading || !selectedRange.startDate || !selectedRange.endDate
            }
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text>{submitLabel}</Text>
            )}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
