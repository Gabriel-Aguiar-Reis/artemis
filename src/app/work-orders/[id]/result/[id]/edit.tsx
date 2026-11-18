import { productHooks } from '@/src/application/hooks/product.hooks'
import { workOrderResultHooks } from '@/src/application/hooks/work-order-result.hooks'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Button } from '@/src/components/ui/button'
import { AddedProductsCombobox } from '@/src/components/ui/combobox/added-products-combobox'
import { ExchangedProductsCombobox } from '@/src/components/ui/combobox/exchanged-products-combobox'
import { RemovedProductsCombobox } from '@/src/components/ui/combobox/removed-products-combobox'
import { Text } from '@/src/components/ui/text'
import { UUID } from '@/src/lib/utils'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Info } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type ResultItemInput = {
  productId: string
  productName: string
  quantity: number
  priceSnapshot: number
}

export default function WorkOrderResultEditByIdScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()
  const { data: result, isLoading } = workOrderResultHooks.getWorkOrderResult(
    params.id
  )
  const { data: allProducts } = productHooks.getProductsWithCategory()
  const { mutateAsync: updateResult } =
    workOrderHooks.useUpdateWorkOrderResult()

  const [exchangedProducts, setExchangedProducts] = useState<ResultItemInput[]>(
    []
  )
  const [addedProducts, setAddedProducts] = useState<ResultItemInput[]>([])
  const [removedProducts, setRemovedProducts] = useState<ResultItemInput[]>([])
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (!result) return
    const exchanged: ResultItemInput[] =
      result.exchangedProducts?.map((item) => ({
        productId: item.productSnapshot.productId,
        productName: item.productSnapshot.productName,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
      })) || []

    const added: ResultItemInput[] =
      result.addedProducts?.map((item) => ({
        productId: item.productSnapshot.productId,
        productName: item.productSnapshot.productName,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
      })) || []

    const removed: ResultItemInput[] =
      result.removedProducts?.map((item) => ({
        productId: item.productSnapshot.productId,
        productName: item.productSnapshot.productName,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
      })) || []

    setExchangedProducts(exchanged)
    setAddedProducts(added)
    setRemovedProducts(removed)
  }, [result])

  const handleSubmit = async () => {
    if (!result || isPending) return

    try {
      setIsPending(true)
      // One transaction: replaces the items, recalculates the work order total and status, and
      // adjusts the unpaid payment. It used to delete item by item and
      // only then reinsert: a failure midway left the report incomplete.
      await updateResult({
        resultId: result.id,
        result: {
          exchanged: exchangedProducts,
          added: addedProducts,
          removed: removedProducts,
        },
      })
      router.back()
    } catch (error) {
      if (__DEV__) console.error('Error updating report:', error)
    } finally {
      setIsPending(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando relatório...</Text>
      </SafeAreaView>
    )
  }

  if (!result) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Relatório não encontrado.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Editar Relatório',
        }}
      />
      <ScrollView className="flex-1 p-4">
        <View className="gap-4">
          <Alert icon={Info}>
            <AlertTitle>Editar Produtos do Relatório</AlertTitle>
            <AlertDescription className="text-xs">
              Você pode adicionar, remover ou modificar as quantidades dos
              produtos trocados, adicionados e removidos. O valor total será
              recalculado automaticamente.
            </AlertDescription>
          </Alert>

          <ExchangedProductsCombobox
            scheduledProducts={[]}
            removedProducts={removedProducts}
            selectedExchangedProducts={exchangedProducts}
            onExchangedProductsChange={setExchangedProducts}
            availableProducts={allProducts}
            label="Produtos Trocados"
            placeholder="Selecione dos produtos"
          />

          <AddedProductsCombobox
            selectedAddedProducts={addedProducts}
            onAddedProductsChange={setAddedProducts}
            label="Produtos Adicionados"
            placeholder="Produtos extras não agendados"
          />

          <RemovedProductsCombobox
            scheduledProducts={[]}
            exchangedProducts={exchangedProducts}
            selectedRemovedProducts={removedProducts}
            onRemovedProductsChange={setRemovedProducts}
            availableProducts={allProducts}
            label="Produtos Removidos"
            placeholder="Produtos não trocados"
          />

          <View className="bg-accent/30 p-4 rounded-lg">
            <Text className="text-base font-semibold mb-2">
              Resumo Atualizado
            </Text>
            <View className="flex-row justify-between items-center pt-2 border-t border-border">
              <Text className="font-bold text-lg">Novo Valor Total:</Text>
              <Text className="font-bold text-xl text-foreground">
                R${' '}
                {(
                  exchangedProducts.reduce(
                    (sum, p) => sum + p.priceSnapshot * p.quantity,
                    0
                  ) +
                  addedProducts.reduce(
                    (sum, p) => sum + p.priceSnapshot * p.quantity,
                    0
                  )
                ).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="p-4 bg-background border-t border-border">
        <Button onPress={handleSubmit} disabled={isPending}>
          <Text className="text-primary-foreground font-semibold">
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  )
}
