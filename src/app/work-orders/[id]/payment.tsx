import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Icon } from '@/src/components/ui/icon'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Text } from '@/src/components/ui/text'
import { UUID } from '@/src/lib/utils'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Edit,
  XCircle,
} from 'lucide-react-native'
import { View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WorkOrderPaymentScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()
  const { data: workOrder, isLoading } = workOrderHooks.getWorkOrder(params.id)

  const handlePaymentOptions = async () => {
    if (!workOrder?.paymentOrder) return

    await SheetManager.show('options-sheet', {
      payload: {
        title: 'Opções de Pagamento',
        options: [
          {
            label: 'Editar Pagamento',
            icon: Edit,
            onPress: () => {
              router.push(`/work-orders/${params.id}/payment/edit`)
            },
          },
        ],
      },
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando pagamento...</Text>
      </SafeAreaView>
    )
  }

  if (!workOrder || !workOrder.paymentOrder) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Pagamento não encontrado.</Text>
      </SafeAreaView>
    )
  }

  const payment = workOrder.paymentOrder

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Detalhes do Pagamento',
        }}
      />
      <View className="flex-1 p-4">
        <ObjectCard.Root className="mb-4 dark:bg-input/30">
          <ObjectCard.Header>
            <ObjectCard.Title>Informações do Pagamento</ObjectCard.Title>
            <ObjectCard.Actions onPress={handlePaymentOptions} />
          </ObjectCard.Header>
          <ObjectCard.Content>
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <Icon
                  as={CreditCard}
                  className="text-muted-foreground"
                  size={20}
                />
                <Text className="text-sm text-muted-foreground flex-1">
                  Método de Pagamento
                </Text>
                <Text className="text-sm font-semibold">{payment.method}</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Icon
                  as={Banknote}
                  className="text-muted-foreground"
                  size={20}
                />
                <Text className="text-sm text-muted-foreground flex-1">
                  Valor Total
                </Text>
                <Text className="text-sm font-semibold">
                  R$ {payment.totalValue.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-muted-foreground flex-1 ml-7">
                  Parcelas
                </Text>
                <Text className="text-sm font-semibold">
                  {payment.installments}x de R${' '}
                  {payment.installmentValue.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-muted-foreground flex-1 ml-7">
                  Parcelas Pagas
                </Text>
                <Text className="text-sm font-semibold">
                  {payment.paidInstallments} / {payment.installments}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                {payment.isPaid ? (
                  <Icon
                    as={CheckCircle2}
                    className="text-green-500"
                    size={20}
                  />
                ) : (
                  <Icon as={XCircle} className="text-red-500" size={20} />
                )}
                <Text className="text-sm text-muted-foreground flex-1">
                  Status
                </Text>
                <Text
                  className={`text-sm font-semibold ${
                    payment.isPaid ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {payment.isPaid ? 'Pago' : 'Pendente'}
                </Text>
              </View>

              {!payment.isPaid && (
                <>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm text-muted-foreground flex-1 ml-7">
                      Valor Pago
                    </Text>
                    <Text className="text-sm font-semibold">
                      R$ {payment.paidValue.toFixed(2)}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm text-muted-foreground flex-1 ml-7">
                      Valor Restante
                    </Text>
                    <Text className="text-sm font-semibold">
                      R$ {payment.remainingValue.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </ObjectCard.Content>
        </ObjectCard.Root>
      </View>
    </SafeAreaView>
  )
}
