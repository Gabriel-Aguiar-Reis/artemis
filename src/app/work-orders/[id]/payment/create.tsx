import { paymentOrderHooks } from '@/src/application/hooks/payment-order.hooks'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Button } from '@/src/components/ui/button'
import { DatePickerInput } from '@/src/components/ui/date-picker-input'
import { BaseForm } from '@/src/components/ui/forms/base-form'
import { Masks } from '@/src/components/ui/masks'
import { Text } from '@/src/components/ui/text'
import {
  PaymentOrderInsertDTO,
  paymentOrderInsertSchema,
} from '@/src/domain/validations/payment-order.schema'
import { getErrorMessage, UUID } from '@/src/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { CircleQuestionMark, CreditCard, Info } from 'lucide-react-native'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import uuid from 'react-native-uuid'

export default function WorkOrderPaymentCreateScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()
  const { data: workOrder, isLoading: isLoadingWorkOrder } =
    workOrderHooks.getWorkOrder(params.id)
  const { mutateAsync: addPaymentOrder, isPending: isAddingPayment } =
    paymentOrderHooks.addPaymentOrder()
  const {
    mutateAsync: updateWorkOrderWithPayment,
    isPending: isUpdatingWorkOrder,
  } = workOrderHooks.updateWorkOrderWithPayment()

  const form = useForm<PaymentOrderInsertDTO>({
    resolver: zodResolver(paymentOrderInsertSchema),
    defaultValues: {
      method: '',
      totalValue: 0,
      installments: 1,
      isPaid: false,
      paidInstallments: 0,
      paymentDate: undefined,
    },
    mode: 'onBlur',
  })

  const installments = form.watch('installments')
  const isPaid = form.watch('isPaid')
  const paymentDate = form.watch('paymentDate')

  // Calcular total baseado nos produtos do resultado (se existir)
  useEffect(() => {
    if (!workOrder?.result) return

    const exchangedProducts = workOrder.result.exchangedProducts || []
    const addedProducts = workOrder.result.addedProducts || []

    const totalValue =
      exchangedProducts.reduce(
        (sum, p) => sum + p.priceSnapshot * p.quantity,
        0
      ) +
      addedProducts.reduce((sum, p) => sum + p.priceSnapshot * p.quantity, 0)

    if (totalValue > 0) {
      form.setValue('totalValue', totalValue)
    }
  }, [workOrder])

  // Se marcar como pago, força parcelas = 1, paidInstallments = 1 e data para hoje se não houver
  useEffect(() => {
    if (isPaid) {
      form.setValue('installments', 1)
      form.setValue('paidInstallments', 1)
      // Se não houver data de pagamento, define como hoje
      if (!paymentDate) {
        form.setValue('paymentDate', new Date() as any)
      }
    }
  }, [isPaid])

  // Se mudar parcelas para > 1, desmarca isPaid
  useEffect(() => {
    if ((installments || 1) > 1 && isPaid) {
      form.setValue('isPaid', false)
      form.setValue('paidInstallments', 0)
    }
  }, [installments, isPaid, form])

  // Se a data de pagamento for futura, desmarca isPaid
  useEffect(() => {
    if (paymentDate && isPaid) {
      const selectedDate =
        paymentDate instanceof Date ? paymentDate : new Date(paymentDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      selectedDate.setHours(0, 0, 0, 0)

      if (selectedDate > today) {
        form.setValue('isPaid', false)
        form.setValue('paidInstallments', 0)
      }
    }
  }, [paymentDate])

  // Verificar se a data de pagamento é futura
  const isPaymentDateFuture = () => {
    if (!paymentDate) return false
    const selectedDate =
      paymentDate instanceof Date ? paymentDate : new Date(paymentDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)
    return selectedDate > today
  }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      // 1. Criar payment order
      const paymentOrderId = uuid.v4() as UUID
      await addPaymentOrder({
        id: paymentOrderId,
        method: data.method,
        totalValue: data.totalValue,
        installments: Number(data.installments),
        isPaid: data.isPaid ?? false,
        paidInstallments: Number(data.paidInstallments ?? 0),
        paymentDate: data.paymentDate
          ? data.paymentDate instanceof Date
            ? data.paymentDate.toISOString()
            : data.paymentDate
          : null,
      })
      // 2. Associar payment order à work order
      await (updateWorkOrderWithPayment as any)([params.id, paymentOrderId])
      router.back()
    } catch (error) {
      console.error('Erro ao criar pagamento:', error)
    }
  })

  if (isLoadingWorkOrder) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando ordem de serviço...</Text>
      </SafeAreaView>
    )
  }

  if (!workOrder) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Ordem de serviço não encontrada.</Text>
      </SafeAreaView>
    )
  }

  if (workOrder.paymentOrder) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Esta ordem de serviço já possui um pagamento registrado.</Text>
      </SafeAreaView>
    )
  }

  const allProductItems = [
    ...(workOrder.result?.exchangedProducts?.map((p) => ({
      ...p,
      type: 'Trocado',
    })) || []),
    ...(workOrder.result?.addedProducts?.map((p) => ({
      ...p,
      type: 'Adicionado',
    })) || []),
  ]

  const isPending = isAddingPayment || isUpdatingWorkOrder

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Criar Pagamento',
        }}
      />
      <ScrollView className="flex-1 p-4">
        <View className="gap-4">
          {/* Resumo dos produtos (se houver relatório) */}
          {allProductItems.length > 0 && (
            <View className="bg-accent/30 p-4 rounded-lg mb-2">
              <Text className="text-base font-semibold mb-3">
                Produtos do Relatório
              </Text>
              {allProductItems.map((item, index) => (
                <View
                  key={index}
                  className="flex-row justify-between items-center py-1"
                >
                  <View className="flex-1">
                    <Text className="text-sm">
                      {item.productSnapshot.productName}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {item.type} • {item.quantity}x R${' '}
                      {item.priceSnapshot.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold">
                    R${' '}
                    {(item.priceSnapshot * item.quantity).toLocaleString(
                      'pt-BR',
                      {
                        minimumFractionDigits: 2,
                      }
                    )}
                  </Text>
                </View>
              ))}
              <View className="flex-row justify-between items-center pt-3 mt-2 border-t-2 border-border">
                <Text className="font-bold text-lg">Total:</Text>
                <Text className="font-bold text-xl text-primary">
                  R${' '}
                  {allProductItems
                    .reduce(
                      (sum, item) => sum + item.priceSnapshot * item.quantity,
                      0
                    )
                    .toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                </Text>
              </View>
            </View>
          )}

          <BaseForm.Input
            control={form.control}
            name="method"
            label="Método de Pagamento"
            placeholder="Ex: Dinheiro, PIX, Cartão"
            error={getErrorMessage(form.formState.errors?.method?.message)}
            icon={CreditCard}
          />

          <DatePickerInput
            value={
              form.watch('paymentDate')
                ? typeof form.watch('paymentDate') === 'string'
                  ? new Date(form.watch('paymentDate')!)
                  : (form.watch('paymentDate') as Date)
                : undefined
            }
            onDateChange={(date) => form.setValue('paymentDate', date as any)}
            label="Data de Pagamento (Opcional)"
            placeholder="Selecione a data de pagamento"
            error={getErrorMessage(form.formState.errors?.paymentDate?.message)}
          />

          <BaseForm.Input.Currency
            control={form.control}
            name="totalValue"
            label="Valor Total"
            placeholder="0.00"
            inputProps={{ keyboardType: 'numeric', mask: Masks.BRL_CURRENCY }}
            error={getErrorMessage(form.formState.errors?.totalValue?.message)}
          />

          {/* Alerta explicativo sobre pagamento */}
          <Alert icon={Info}>
            <AlertTitle>Sobre o Pagamento</AlertTitle>
            <AlertDescription>
              {isPaid
                ? 'Pagamento à vista foi marcado como realizado. O número de parcelas foi definido como 1.'
                : (installments || 1) > 1
                  ? `Pagamento parcelado em ${installments}x. Você poderá marcar cada parcela como paga posteriormente.`
                  : isPaymentDateFuture()
                    ? 'A data de pagamento está no futuro. Pagamentos futuros não podem ser marcados como realizados.'
                    : 'Marque "Pagamento à Vista Realizado" se o valor foi pago à vista, ou defina o número de parcelas para pagamento parcelado.'}
            </AlertDescription>
          </Alert>

          {installments === 1 ? (
            <BaseForm.Checkbox
              control={form.control}
              name="isPaid"
              label="Pagamento à Vista Realizado"
              inputProps={{ disabled: isPaymentDateFuture() }}
            />
          ) : (
            <Controller
              control={form.control}
              name="paidInstallments"
              render={({ field: { onChange, value } }) => (
                <BaseForm.Input
                  control={form.control}
                  name="paidInstallments"
                  label="Parcelas Pagas"
                  placeholder="0"
                  error={getErrorMessage(
                    form.formState.errors?.paidInstallments?.message
                  )}
                  inputProps={{
                    keyboardType: 'numeric',
                    value: String(value || ''),
                    onChangeText: (text: string) => {
                      const num = text === '' ? 0 : Number(text)
                      if (!isNaN(num)) onChange(num)
                    },
                  }}
                  icon={CircleQuestionMark}
                />
              )}
            />
          )}

          <Controller
            control={form.control}
            name="installments"
            render={({ field: { onChange, value } }) => (
              <BaseForm.Input
                control={form.control}
                name="installments"
                label="Número de Parcelas"
                placeholder={
                  isPaid ? '1' : 'Ex: 1 (à vista) ou mais (parcelado)'
                }
                error={getErrorMessage(
                  form.formState.errors?.installments?.message
                )}
                inputProps={{
                  keyboardType: 'numeric',
                  editable: !isPaid,
                  value: String(value || ''),
                  onChangeText: (text: string) => {
                    const num = text === '' ? 1 : Number(text)
                    if (!isNaN(num)) onChange(num)
                  },
                }}
                icon={CircleQuestionMark}
                iconTooltip="Para pagamento à vista, use 1. Para parcelado, defina o número de parcelas."
              />
            )}
          />
        </View>
      </ScrollView>

      <View className="p-4 bg-background border-t border-border">
        <Button onPress={onSubmit} disabled={isPending}>
          <Text className="text-primary-foreground font-semibold">
            {isPending ? 'Salvando...' : 'Salvar Pagamento'}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  )
}
