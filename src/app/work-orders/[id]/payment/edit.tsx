import { paymentOrderHooks } from '@/src/application/hooks/payment-order.hooks'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Button } from '@/src/components/ui/button'
import { DatePickerInput } from '@/src/components/ui/date-picker-input'
import { BaseForm } from '@/src/components/ui/forms/base-form'
import { Masks } from '@/src/components/ui/masks'
import { Text } from '@/src/components/ui/text'
import {
  PaymentOrderUpdateDTO,
  paymentOrderUpdateSchema,
} from '@/src/domain/validations/payment-order.schema'
import { getErrorMessage, UUID } from '@/src/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { CircleQuestionMark, CreditCard, Info } from 'lucide-react-native'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function PaymentEditScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()
  const { data: workOrder, isLoading: isLoadingWorkOrder } =
    workOrderHooks.getWorkOrder(params.id)
  const { mutateAsync: updatePayment, isPending } =
    paymentOrderHooks.updatePaymentOrder()

  const form = useForm<PaymentOrderUpdateDTO>({
    resolver: zodResolver(paymentOrderUpdateSchema),
    defaultValues: {
      method: '',
      totalValue: '0',
      installments: '1',
      isPaid: false,
      paidInstallments: '0',
      paymentDate: undefined,
    },
    mode: 'onBlur',
  })

  const installments = Number(form.watch('installments')) || 1
  const isPaid = form.watch('isPaid')
  const paidInstallments = Number(form.watch('paidInstallments')) || 0
  const paymentDate = form.watch('paymentDate')

  // Se marcar como pago, força parcelas = 1, paidInstallments = 1 e data para hoje se não houver
  useEffect(() => {
    if (isPaid) {
      form.setValue('installments', '1')
      form.setValue('paidInstallments', '1')
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
        form.setValue('paidInstallments', '0')
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
    if (!workOrder?.paymentOrder) return

    try {
      // O BaseForm envia com coma decimal, converter para ponto
      const normalized = String(data.totalValue || '0').replace(',', '.')
      const totalValueNumber = Number(normalized) || 0

      await updatePayment({
        id: workOrder.paymentOrder.id,
        method: data.method,
        totalValue: totalValueNumber,
        installments: Number(data.installments) || 1,
        isPaid: data.isPaid ?? false,
        paidInstallments: Number(data.paidInstallments) || 0,
        paymentDate: data.paymentDate
          ? data.paymentDate instanceof Date
            ? data.paymentDate.toISOString()
            : data.paymentDate
          : null,
      } as any)
      router.back()
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error)
    }
  })

  useEffect(() => {
    if (!workOrder?.paymentOrder) return

    form.reset({
      method: workOrder.paymentOrder.method,
      totalValue: workOrder.paymentOrder.totalValue
        .toFixed(2)
        .replace('.', ','),
      installments: workOrder.paymentOrder.installments.toString(),
      isPaid: workOrder.paymentOrder.isPaid,
      paidInstallments: workOrder.paymentOrder.paidInstallments.toString(),
      paymentDate: workOrder.paymentOrder.paymentDate
        ? (new Date(workOrder.paymentOrder.paymentDate) as any)
        : undefined,
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
          {/* Resumo dos produtos do resultado (se existir) */}
          {workOrder.result && (
            <View className="bg-accent/30 p-4 rounded-lg mb-2">
              <Text className="text-sm font-semibold mb-2">
                Produtos do Resultado
              </Text>
              {[
                ...(workOrder.result.exchangedProducts?.map((p) => ({
                  ...p,
                  type: 'Trocado',
                })) || []),
                ...(workOrder.result.addedProducts?.map((p) => ({
                  ...p,
                  type: 'Adicionado',
                })) || []),
              ].map((item, index) => (
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
              <View className="flex-row justify-between items-center pt-2 mt-2 border-t border-border">
                <Text className="font-semibold">Total:</Text>
                <Text className="font-bold text-lg text-primary">
                  R${' '}
                  {workOrder.result.totalValue.toLocaleString('pt-BR', {
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
                ? 'Pagamento à vista marcado como realizado. O número de parcelas é 1.'
                : installments === 1
                  ? isPaymentDateFuture()
                    ? 'A data de pagamento está no futuro. Pagamentos futuros não podem ser marcados como realizados.'
                    : 'Pagamento à vista. Marque "Pagamento à Vista Realizado" se o valor já foi recebido.'
                  : `Pagamento parcelado em ${installments}x. ${paidInstallments} de ${installments} parcela(s) paga(s).`}
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
