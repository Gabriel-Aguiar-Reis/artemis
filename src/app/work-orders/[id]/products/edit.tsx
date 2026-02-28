import { productHooks } from '@/src/application/hooks/product.hooks'
import { workOrderItemHooks } from '@/src/application/hooks/work-order-item.hooks'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Button } from '@/src/components/ui/button'
import { ProductCombobox } from '@/src/components/ui/combobox/product-combobox'
import { Text } from '@/src/components/ui/text'
import { UUID } from '@/src/lib/utils'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

type ProductInput = {
  productId: string
  quantity: number
}

export default function WorkOrderProductsEditScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()
  const { data: workOrder, isLoading: isLoadingWorkOrder } =
    workOrderHooks.getWorkOrder(params.id)
  const { data: allProducts } = productHooks.getProductsWithCategory()
  const { mutateAsync: deleteWorkOrderItemsByWorkOrderId } =
    workOrderItemHooks.deleteWorkOrderItemsByWorkOrderId()
  const { mutateAsync: addWorkOrderItems } =
    workOrderItemHooks.addWorkOrderItems()

  const [selectedProducts, setSelectedProducts] = useState<ProductInput[]>([])
  const [isPending, setIsPending] = useState(false)

  // Carregar produtos agendados existentes
  useEffect(() => {
    if (!workOrder || !workOrder.products) return

    const products: ProductInput[] = workOrder.products.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }))

    setSelectedProducts(products)
  }, [workOrder])

  const handleSave = async () => {
    if (!workOrder) return

    try {
      setIsPending(true)

      // 1. Deletar todos os produtos agendados existentes
      await deleteWorkOrderItemsByWorkOrderId(params.id)

      // 2. Se houver produtos selecionados, adicionar os novos
      if (selectedProducts.length > 0) {
        if (!allProducts) {
          throw new Error('Produtos não encontrados')
        }

        const itemsDTO = selectedProducts.map((p) => {
          const productInfo = allProducts.find(
            (prod) => prod.id === p.productId
          )
          if (!productInfo) {
            throw new Error(`Produto ${p.productId} não encontrado`)
          }

          return {
            productId: productInfo.id as UUID,
            quantity: p.quantity,
            priceSnapshot: productInfo.salePrice,
          }
        })

        // Adicionar os novos items
        await (addWorkOrderItems as any)([itemsDTO, params.id])
      }

      Toast.show({
        type: 'success',
        text1: 'Produtos atualizados com sucesso!',
      })

      router.back()
    } catch (error) {
      console.error('Erro ao atualizar produtos:', error)
      Toast.show({
        type: 'error',
        text1: 'Erro ao atualizar produtos',
        text2: error instanceof Error ? error.message : 'Erro desconhecido',
      })
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

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Editar Produtos Agendados',
        }}
      />
      <View className="flex-1 p-4 gap-4">
        <ProductCombobox
          selectedProducts={selectedProducts}
          onProductsChange={(products) => setSelectedProducts(products)}
          label="Produtos Agendados"
          placeholder="Selecione os produtos"
          multiple={true}
        />

        <View className="flex-row justify-between gap-2 mt-auto">
          <Button
            variant="outline"
            size="default"
            onPress={() => router.back()}
            disabled={isPending}
            className="flex-1"
          >
            <Text>Cancelar</Text>
          </Button>

          <Button
            variant="default"
            size="default"
            onPress={handleSave}
            disabled={isPending}
            className="flex-1"
          >
            <Text>{isPending ? 'Salvando...' : 'Salvar'}</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
