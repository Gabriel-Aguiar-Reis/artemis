import { paymentOrderHooks } from '@/src/application/hooks/payment-order.hooks'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Button } from '@/src/components/ui/button'
import { FloatingLabelInput } from '@/src/components/ui/floating-label-input'
import { Text } from '@/src/components/ui/text'
import { Toggle } from '@/src/components/ui/toggle'
import {
  PaymentOrderUpdateDTO,
  paymentOrderUpdateSchema,
} from '@/src/domain/validations/payment-order.schema'
import { getErrorMessage, UUID } from '@/src/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function PaymentEditScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()
  const { data: workOrder, isLoading: isLoadingWorkOrder } =
    workOrderHooks.getWorkOrder(params.id)
  const { mutate: updatePayment, isPending } =
    paymentOrderHooks.updatePaymentOrder()

  const form = useForm<PaymentOrderUpdateDTO>({
    resolver: zodResolver(paymentOrderUpdateSchema),
    defaultValues: {
      method: '',
      totalValue: 0,
      installments: 1,
      isPaid: false,
      paidInstallments: 0,
    },
    mode: 'onBlur',
  })

  const onSubmit = form.handleSubmit((data) => {
    if (!workOrder?.paymentOrder) return

    updatePayment({
      id: workOrder.paymentOrder.id,
      method: data.method,
      totalValue: Number(data.totalValue),
      installments: Number(data.installments),
      isPaid: data.isPaid ?? false,
      paidInstallments: Number(data.paidInstallments),
    })
    router.back()
  })

  useEffect(() => {
    if (!workOrder?.paymentOrder) return

    form.reset({
      method: workOrder.paymentOrder.method,
      totalValue: workOrder.paymentOrder.totalValue,
      installments: workOrder.paymentOrder.installments,
      isPaid: workOrder.paymentOrder.isPaid,
      paidInstallments: workOrder.paymentOrder.paidInstallments,
    })
  }, [workOrder])

  if (isLoadingWorkOrder) {
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

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Editar Pagamento',
        }}
      />
      <ScrollView className="flex-1 p-4">
        <View className="gap-4">
          <Controller
            control={form.control}
            name="method"
            render={({ field: { onChange, onBlur, value } }) => (
              <FloatingLabelInput
                label="Método de Pagamento"
                placeholder="Ex: Dinheiro, Cartão, PIX"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={getErrorMessage(form.formState.errors?.method?.message)}
              />
            )}
          />

          <Controller
            control={form.control}
            name="totalValue"
            render={({ field: { onChange, onBlur, value } }) => (
              <FloatingLabelInput
                label="Valor Total"
                placeholder="0.00"
                value={String(value)}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                onBlur={onBlur}
                error={getErrorMessage(
                  form.formState.errors?.totalValue?.message
                )}
                keyboardType="numeric"
              />
            )}
          />

          <Controller
            control={form.control}
            name="installments"
            render={({ field: { onChange, onBlur, value } }) => (
              <FloatingLabelInput
                label="Número de Parcelas"
                placeholder="1"
                value={String(value)}
                onChangeText={(text) => onChange(parseInt(text) || 1)}
                onBlur={onBlur}
                error={getErrorMessage(
                  form.formState.errors?.installments?.message
                )}
                keyboardType="numeric"
              />
            )}
          />

          <Controller
            control={form.control}
            name="paidInstallments"
            render={({ field: { onChange, onBlur, value } }) => (
              <FloatingLabelInput
                label="Parcelas Pagas"
                placeholder="0"
                value={String(value)}
                onChangeText={(text) => onChange(parseInt(text) || 0)}
                onBlur={onBlur}
                error={getErrorMessage(
                  form.formState.errors?.paidInstallments?.message
                )}
                keyboardType="numeric"
              />
            )}
          />

          <Controller
            control={form.control}
            name="isPaid"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium">Pagamento Completo</Text>
                <Toggle pressed={value ?? false} onPressedChange={onChange} />
              </View>
            )}
          />

          <Button onPress={onSubmit} disabled={isPending}>
            <Text className="text-primary-foreground font-semibold">
              {isPending ? 'Salvando...' : 'Salvar Pagamento'}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
