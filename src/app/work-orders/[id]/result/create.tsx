import { productHooks } from '@/src/application/hooks/product.hooks'
import { workOrderResultItemHooks } from '@/src/application/hooks/work-order-result-item.hooks'
import { workOrderResultHooks } from '@/src/application/hooks/work-order-result.hooks'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Button } from '@/src/components/ui/button'
import { AddedProductsCombobox } from '@/src/components/ui/combobox/added-products-combobox'
import { ExchangedProductsCombobox } from '@/src/components/ui/combobox/exchanged-products-combobox'
import { RemovedProductsCombobox } from '@/src/components/ui/combobox/removed-products-combobox'
import { Text } from '@/src/components/ui/text'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import {
  WorkOrderResultItem,
  WorkOrderResultItemType,
} from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { UUID } from '@/src/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import uuid from 'react-native-uuid'

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
  const { mutateAsync: addWorkOrderResult } =
    workOrderResultHooks.addWorkOrderResult()
  const { mutateAsync: addWorkOrderResultItems } =
    workOrderResultItemHooks.addWorkOrderResultItems()
  const { mutateAsync: updateWorkOrderWithResult } =
    workOrderHooks.updateWorkOrderWithResult()

  const queryClient = useQueryClient()

  const [exchangedProducts, setExchangedProducts] = useState<ResultItemInput[]>(
    []
  )
  const [addedProducts, setAddedProducts] = useState<ResultItemInput[]>([])
  const [removedProducts, setRemovedProducts] = useState<ResultItemInput[]>([])
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async () => {
    if (!workOrder) return

    try {
      setIsPending(true)

      // Calcular total value
      const totalValue =
        exchangedProducts.reduce(
          (sum, p) => sum + p.priceSnapshot * p.quantity,
          0
        ) +
        addedProducts.reduce((sum, p) => sum + p.priceSnapshot * p.quantity, 0)

      // 1. Criar WorkOrderResult
      const resultId = uuid.v4() as UUID
      await addWorkOrderResult({
        id: resultId,
        totalValue,
      })

      // 2. Criar WorkOrderResultItems
      const allResultItems = [
        ...exchangedProducts.map((p) =>
          WorkOrderResultItem.fromProductSnapshot(
            uuid.v4() as UUID,
            ProductSnapshot.fromDTO({
              productId: p.productId as UUID,
              productName: p.productName,
              salePrice: p.priceSnapshot,
            }),
            resultId,
            p.quantity,
            WorkOrderResultItemType.EXCHANGED,
            p.priceSnapshot
          )
        ),
        ...addedProducts.map((p) =>
          WorkOrderResultItem.fromProductSnapshot(
            uuid.v4() as UUID,
            ProductSnapshot.fromDTO({
              productId: p.productId as UUID,
              productName: p.productName,
              salePrice: p.priceSnapshot,
            }),
            resultId,
            p.quantity,
            WorkOrderResultItemType.ADDED,
            p.priceSnapshot
          )
        ),
        ...removedProducts.map((p) =>
          WorkOrderResultItem.fromProductSnapshot(
            uuid.v4() as UUID,
            ProductSnapshot.fromDTO({
              productId: p.productId as UUID,
              productName: p.productName,
              salePrice: p.priceSnapshot,
            }),
            resultId,
            p.quantity,
            WorkOrderResultItemType.REMOVED,
            p.priceSnapshot
          )
        ),
      ]

      if (allResultItems.length > 0) {
        await (addWorkOrderResultItems as any)([allResultItems])
      }

      // 3. Associar result à work order
      await updateWorkOrderWithResult([
        workOrder.id,
        resultId,
        'completed',
        new Date(),
      ])

      queryClient.removeQueries({ queryKey: ['itineraryWorkOrders'] })
      queryClient.removeQueries({ queryKey: ['workOrders'] })
      queryClient.removeQueries({ queryKey: ['workOrderResults'] })
      queryClient.removeQueries({ queryKey: ['workOrderResultItems'] })
      queryClient.removeQueries({ queryKey: ['itineraries'] })

      setTimeout(() => {
        router.back()
      }, 100)
    } catch (error) {
      console.error('Erro ao criar relatório:', error)
    } finally {
      setIsPending(false)
    }
  }

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

  if (workOrder.result) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Esta ordem de serviço já possui um relatório registrado.</Text>
      </SafeAreaView>
    )
  }

  const scheduledProducts = workOrder.products || []

  return (
    <SafeAreaView className="flex-1">
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

          <Button onPress={handleSubmit} disabled={isPending}>
            <Text className="text-primary-foreground font-semibold">
              {isPending ? 'Salvando...' : 'Salvar Relatório'}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
