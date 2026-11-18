import { productHooks } from '@/src/application/hooks/product.hooks'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Button } from '@/src/components/ui/button'
import { AddedProductsCombobox } from '@/src/components/ui/combobox/added-products-combobox'
import { ExchangedProductsCombobox } from '@/src/components/ui/combobox/exchanged-products-combobox'
import { RemovedProductsCombobox } from '@/src/components/ui/combobox/removed-products-combobox'
import { Text } from '@/src/components/ui/text'
import { UUID } from '@/src/lib/utils'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type ResultItemInput = {
  productId: string
  productName: string
  quantity: number
  priceSnapshot: number
}

export default function WorkOrderResultCreateScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()
  const { data: workOrder, isLoading: isLoadingWorkOrder } =
    workOrderHooks.getWorkOrder(params.id)
  const { data: allProducts } = productHooks.getProductsWithCategory()
  const { mutateAsync: saveResult } = workOrderHooks.useSaveWorkOrderResult()

  const [exchangedProducts, setExchangedProducts] = useState<ResultItemInput[]>(
    []
  )
  const [addedProducts, setAddedProducts] = useState<ResultItemInput[]>([])
  const [removedProducts, setRemovedProducts] = useState<ResultItemInput[]>([])
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async () => {
    if (!workOrder || isPending) return

    try {
      setIsPending(true)
      // One transaction: report + items + computed status (COMPLETED,
      // PARTIAL or FAILED) + visit date + itinerary lateness.
      // It used to store the lowercase 'completed' status, outside the enum.
      await saveResult({
        workOrderId: workOrder.id,
        result: {
          exchanged: exchangedProducts,
          added: addedProducts,
          removed: removedProducts,
        },
      })
      router.back()
    } catch (error) {
      // error toast shown by the hook
      if (__DEV__) console.error('Error creating report:', error)
    } finally {
      setIsPending(false)
    }
  }

  if (isLoadingWorkOrder) {
    return (
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        className="flex-1 items-center justify-center"
      >
        <Text>Carregando ordem de serviço...</Text>
      </SafeAreaView>
    )
  }

  if (!workOrder) {
    return (
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        className="flex-1 items-center justify-center"
      >
        <Text>Ordem de serviço não encontrada.</Text>
      </SafeAreaView>
    )
  }

  if (workOrder.result) {
    return (
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        className="flex-1 items-center justify-center"
      >
        <Text>Esta ordem de serviço já possui um relatório registrado.</Text>
      </SafeAreaView>
    )
  }

  const scheduledProducts = workOrder.products || []

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1">
      <Stack.Screen
        options={{
          title: 'Criar Relatório',
        }}
      />
      <ScrollView className="flex-1 p-4">
        <View className="gap-4">
          <ExchangedProductsCombobox
            scheduledProducts={scheduledProducts.map((p) => ({
              productId: p.productId,
              quantity: p.quantity,
            }))}
            removedProducts={removedProducts}
            selectedExchangedProducts={exchangedProducts}
            onExchangedProductsChange={setExchangedProducts}
            availableProducts={allProducts}
            label="Produtos Trocados"
            placeholder="Selecione dos produtos agendados"
          />

          <AddedProductsCombobox
            selectedAddedProducts={addedProducts}
            onAddedProductsChange={setAddedProducts}
            label="Produtos Adicionados"
            placeholder="Produtos extras não agendados"
          />

          <RemovedProductsCombobox
            scheduledProducts={scheduledProducts.map((p) => ({
              productId: p.productId,
              quantity: p.quantity,
            }))}
            exchangedProducts={exchangedProducts}
            selectedRemovedProducts={removedProducts}
            onRemovedProductsChange={setRemovedProducts}
            availableProducts={allProducts}
            label="Produtos Removidos"
            placeholder="Produtos não trocados"
          />
        </View>
      </ScrollView>

      <View className="p-4 bg-background border-t border-border">
        <Button onPress={handleSubmit} disabled={isPending}>
          <Text className="text-primary-foreground font-semibold">
            {isPending ? 'Salvando...' : 'Salvar Relatório'}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  )
}
