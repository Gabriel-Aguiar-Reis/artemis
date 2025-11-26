import { customerHooks } from '@/src/application/hooks/customer.hooks'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { PaymentOrder } from '@/src/domain/entities/payment-order/payment-order.entity'
import { UUID } from '@/src/lib/utils'
import { Picker } from '@react-native-picker/picker'
import { router, Stack } from 'expo-router'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import uuid from 'react-native-uuid'

export default function WorkOrderFormScreen() {
  const { mutate: addWorkOrder } = workOrderHooks.addWorkOrder()
  const { data: customers, isLoading } = customerHooks.getCustomers()

  const [customerId, setCustomerId] = React.useState('')
  const [scheduledDate, setScheduledDate] = React.useState(new Date())
  const [paymentMethod, setPaymentMethod] = React.useState('Dinheiro')
  const [installments, setInstallments] = React.useState('1')

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando clientes...</Text>
      </SafeAreaView>
    )
  }

  if (!customers || customers.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4">
        <Text className="text-center text-muted-foreground">
          Nenhum cliente cadastrado. Por favor, cadastre um cliente antes de
          criar uma ordem de serviço.
        </Text>
      </SafeAreaView>
    )
  }

  const handleSubmit = () => {
    try {
      const customer = customers.find((c) => c.id === customerId)
      if (!customer) {
        alert('Selecione um cliente')
        return
      }

      const paymentOrder = new PaymentOrder(
        uuid.v4() as UUID,
        paymentMethod,
        0, // Será atualizado quando adicionar produtos
        parseInt(installments),
        false,
        0
      )

      addWorkOrder({
        customer,
        scheduledDate,
        paymentOrder,
      } as any)

      router.back()
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: 'Nova Ordem de Serviço' }} />
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          <View>
            <Text className="mb-2 font-medium">Cliente</Text>
            <View className="rounded-md border border-input bg-background">
              <Picker selectedValue={customerId} onValueChange={setCustomerId}>
                <Picker.Item label="Selecione um cliente" value="" />
                {customers.map((customer) => (
                  <Picker.Item
                    key={customer.id}
                    label={customer.storeName}
                    value={customer.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View>
            <Text className="mb-2 font-medium">Método de Pagamento</Text>
            <View className="rounded-md border border-input bg-background">
              <Picker
                selectedValue={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <Picker.Item label="Dinheiro" value="Dinheiro" />
                <Picker.Item
                  label="Cartão de Crédito"
                  value="Cartão de Crédito"
                />
                <Picker.Item
                  label="Cartão de Débito"
                  value="Cartão de Débito"
                />
                <Picker.Item label="PIX" value="PIX" />
                <Picker.Item label="Boleto" value="Boleto" />
              </Picker>
            </View>
          </View>

          <View>
            <Text className="mb-2 font-medium">Número de Parcelas</Text>
            <View className="rounded-md border border-input bg-background">
              <Picker
                selectedValue={installments}
                onValueChange={setInstallments}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <Picker.Item
                    key={num}
                    label={`${num}x`}
                    value={num.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <Text className="text-sm text-muted-foreground">
            Nota: Produtos serão adicionados posteriormente na tela de detalhes
          </Text>

          <Button onPress={handleSubmit} className="mt-4">
            <Text>Criar Ordem de Serviço</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
