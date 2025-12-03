import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Button } from '@/src/components/ui/button'
import { FloatingLabelInput } from '@/src/components/ui/floating-label-input'
import { Text } from '@/src/components/ui/text'
import { getErrorMessage, UUID } from '@/src/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Banknote } from 'lucide-react-native'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'

const resultUpdateSchema = z.object({
  totalValue: z.number().min(0, 'O valor total deve ser maior ou igual a zero'),
})

type ResultUpdateDTO = z.infer<typeof resultUpdateSchema>

export default function ResultEditScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()
  const { data: workOrder, isLoading: isLoadingWorkOrder } =
    workOrderHooks.getWorkOrder(params.id)

  // Note: You'll need to create a hook for updating work order result
  // For now, this is a placeholder structure
  const form = useForm<ResultUpdateDTO>({
    resolver: zodResolver(resultUpdateSchema),
    defaultValues: {
      totalValue: 0,
    },
    mode: 'onBlur',
  })

  const onSubmit = form.handleSubmit((data: ResultUpdateDTO) => {
    if (!workOrder?.result) return

    // TODO: Implement result update mutation
    console.log('Update result:', data)
    router.back()
  })

  useEffect(() => {
    if (!workOrder?.result) return

    form.reset({
      totalValue: workOrder.result.totalValue,
    })
  }, [workOrder])

  if (isLoadingWorkOrder) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando resultado...</Text>
      </SafeAreaView>
    )
  }

  if (!workOrder || !workOrder.result) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Resultado não encontrado.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Editar Resultado',
        }}
      />
      <ScrollView className="flex-1 p-4">
        <View className="gap-4">
          <Text className="text-muted-foreground text-sm mb-2">
            A edição completa de produtos trocados, adicionados e removidos deve
            ser feita através da tela de criação do resultado.
          </Text>

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
                rightIcon={Banknote}
              />
            )}
          />

          <View className="bg-muted/30 p-4 rounded-lg">
            <Text className="text-sm font-semibold mb-2">Resumo Atual</Text>
            <View className="gap-1">
              <Text className="text-sm text-muted-foreground">
                Produtos Trocados:{' '}
                {workOrder.result.exchangedProducts?.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                ) || 0}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Produtos Adicionados:{' '}
                {workOrder.result.addedProducts?.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                ) || 0}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Produtos Removidos:{' '}
                {workOrder.result.removedProducts?.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                ) || 0}
              </Text>
            </View>
          </View>

          <Button onPress={onSubmit}>
            <Text className="text-primary-foreground font-semibold">
              Salvar Resultado
            </Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
