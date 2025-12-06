import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Button } from '@/src/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { DatePickerInput } from '@/src/components/ui/date-picker-input'
import { Icon } from '@/src/components/ui/icon'
import { Separator } from '@/src/components/ui/separator'
import { Text } from '@/src/components/ui/text'
import { WhatsAppIcon } from '@/src/components/ui/whatsapp-icon'
import { formatPhoneBrazil, UUID } from '@/src/lib/utils'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import {
  Calendar,
  Contact,
  Copy,
  MapPinned,
  Package,
  Store,
} from 'lucide-react-native'
import React, { useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function CloneWorkOrderScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()
  const { data: workOrder, isLoading } = workOrderHooks.getWorkOrder(params.id)
  const { mutateAsync: addCreateFromFinished } =
    workOrderHooks.addCreateFromFinished()

  const [newScheduledDate, setNewScheduledDate] = useState<Date>(new Date())
  const [isCloning, setIsCloning] = useState(false)

  const handleClone = async () => {
    if (!workOrder || !workOrder.result || !workOrder.paymentOrder) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Ordem de serviço não possui relatório ou pagamento.',
      })
      return
    }

    setIsCloning(true)
    try {
      await (addCreateFromFinished as any)([
        params.id,
        newScheduledDate,
        undefined,
      ])
      Toast.show({
        type: 'success',
        text1: 'Ordem de serviço clonada com sucesso!',
      })

      router.back()
    } catch (error) {
      console.error('Erro ao clonar ordem de serviço:', error)
      Toast.show({
        type: 'error',
        text1: 'Erro ao clonar',
        text2: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setIsCloning(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-center text-muted-foreground mt-2">
          Carregando ordem de serviço...
        </Text>
      </SafeAreaView>
    )
  }

  if (!workOrder) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-4">
        <Text className="text-center text-muted-foreground">
          Ordem de serviço não encontrada
        </Text>
      </SafeAreaView>
    )
  }

  if (!workOrder.result || !workOrder.paymentOrder) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-4">
        <Text className="text-center text-muted-foreground">
          A ordem de serviço deve possuir relatório e pagamento para ser
          clonada.
        </Text>
      </SafeAreaView>
    )
  }

  const productsToClone = workOrder.result.getExchangedAndAddedProducts()

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Clonar Ordem de Serviço',
        }}
      />
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>
                <View className="flex-row items-center gap-2">
                  <Icon as={Copy} size={20} className="text-primary" />
                  <Text className="text-lg font-semibold">Cliente</Text>
                </View>
              </CardTitle>
              <CardDescription>
                O cliente será mantido na ordem clonada
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-3">
              <View className="flex-row items-center gap-2">
                <Icon as={Store} size={18} className="text-primary" />
                <Text className="text-base font-semibold">
                  {workOrder.customer.storeName}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Icon
                  as={Contact}
                  size={16}
                  className="text-muted-foreground"
                />
                <Text className="text-sm text-muted-foreground">
                  {workOrder.customer.contactName}
                </Text>
                {workOrder.customer.phoneNumber && (
                  <Text className="text-xs text-muted-foreground">
                    {formatPhoneBrazil(workOrder.customer.phoneNumber.value)}
                  </Text>
                )}
                {workOrder.customer.isActiveWhatsApp() && (
                  <WhatsAppIcon size={16} className="text-green-600 ml-1" />
                )}
              </View>

              <View className="flex-row items-start gap-2">
                <Icon
                  as={MapPinned}
                  size={16}
                  className="text-muted-foreground mt-0.5"
                />
                <Text className="text-sm text-muted-foreground flex-1">
                  {workOrder.customer.storeAddress.getFullAddress()}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Nova Data Agendada */}
          <Card>
            <CardHeader>
              <CardTitle>
                <View className="flex-row items-center gap-2">
                  <Icon as={Calendar} size={20} className="text-primary" />
                  <Text className="text-lg font-semibold">
                    Nova Data Agendada
                  </Text>
                </View>
              </CardTitle>
              <CardDescription>
                Escolha a data para a nova ordem de serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DatePickerInput
                value={newScheduledDate}
                onDateChange={setNewScheduledDate}
                label="Data da Visita"
                placeholder="Selecione a data"
              />
            </CardContent>
          </Card>

          {/* Produtos a Clonar */}
          <Card>
            <CardHeader>
              <CardTitle>
                <View className="flex-row items-center gap-2">
                  <Icon as={Package} size={20} className="text-primary" />
                  <Text className="text-lg font-semibold">
                    Produtos a Clonar
                  </Text>
                </View>
              </CardTitle>
              <CardDescription>
                Produtos trocados e adicionados do relatório
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-2">
              {productsToClone.length === 0 ? (
                <Text className="text-sm text-muted-foreground text-center py-4">
                  Nenhum produto para clonar
                </Text>
              ) : (
                <>
                  {productsToClone.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <View className="flex-row justify-between items-center py-2">
                        <View className="flex-1">
                          <Text className="text-base font-medium">
                            {item.productName}
                          </Text>
                          <Text className="text-sm text-muted-foreground">
                            {item.quantity}x R${' '}
                            {item.priceSnapshot.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </Text>
                        </View>
                        <Text className="text-base font-semibold">
                          R${' '}
                          {(item.quantity * item.priceSnapshot).toLocaleString(
                            'pt-BR',
                            {
                              minimumFractionDigits: 2,
                            }
                          )}
                        </Text>
                      </View>
                      {index < productsToClone.length - 1 && (
                        <Separator orientation="horizontal" />
                      )}
                    </React.Fragment>
                  ))}

                  <Separator orientation="horizontal" className="my-2" />

                  <View className="flex-row justify-between items-center pt-2">
                    <Text className="text-lg font-bold">Total</Text>
                    <Text className="text-lg font-bold">
                      R${' '}
                      {workOrder.result.totalValue.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </>
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <View className="gap-3 pb-4">
            <Button onPress={handleClone} disabled={isCloning}>
              {isCloning ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-primary-foreground font-medium">
                    Clonando...
                  </Text>
                </View>
              ) : (
                <Text className="text-primary-foreground font-medium">
                  Criar Ordem de Serviço
                </Text>
              )}
            </Button>
            <Button
              variant="outline"
              onPress={() => router.back()}
              disabled={isCloning}
            >
              <Text>Cancelar</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
