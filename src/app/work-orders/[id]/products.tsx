import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Icon } from '@/src/components/ui/icon'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Text } from '@/src/components/ui/text'
import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import { UUID } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Edit, Package } from 'lucide-react-native'
import { View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WorkOrderProductsScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()
  const { data: workOrder, isLoading } = workOrderHooks.getWorkOrder(params.id)

  const handleProductsOptions = async () => {
    await SheetManager.show('options-sheet', {
      payload: {
        title: 'Opções de Produtos',
        options: [
          {
            label: 'Editar Produtos',
            icon: Edit,
            onPress: () => {
              router.push(`/work-orders/${params.id}/products/edit`)
            },
          },
        ],
      },
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando produtos...</Text>
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

  const items = workOrder.products || []
  const totalValue = items.reduce(
    (sum: number, item: WorkOrderItem) =>
      sum + item.priceSnapshot * item.quantity,
    0
  )

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Produtos Agendados',
        }}
      />
      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhum produto agendado nesta ordem de serviço.
          </Text>
        </View>
      ) : (
        <View className="flex-1 p-4">
          <ObjectCard.Root className="mb-4 dark:bg-input/30">
            <ObjectCard.Header>
              <ObjectCard.Title>Resumo</ObjectCard.Title>
              <ObjectCard.Actions onPress={handleProductsOptions} />
            </ObjectCard.Header>
            <ObjectCard.Content>
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Icon
                    as={Package}
                    className="text-muted-foreground"
                    size={20}
                  />
                  <Text className="text-sm text-muted-foreground flex-1">
                    Total de Produtos
                  </Text>
                  <Text className="text-sm font-semibold">
                    {items.reduce(
                      (sum: number, item: WorkOrderItem) => sum + item.quantity,
                      0
                    )}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-muted-foreground flex-1 ml-7">
                    Valor Total
                  </Text>
                  <Text className="text-sm font-semibold">
                    R${' '}
                    {totalValue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            </ObjectCard.Content>
          </ObjectCard.Root>

          <Text className="text-lg font-bold mb-3">Produtos</Text>
          <FlashList
            data={items}
            renderItem={({ item }: { item: WorkOrderItem }) => (
              <ObjectCard.Root className="mb-3 dark:bg-input/30">
                <ObjectCard.Header>
                  <ObjectCard.Title>{item.productName}</ObjectCard.Title>
                </ObjectCard.Header>
                <ObjectCard.Content>
                  <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm text-muted-foreground flex-1">
                        Quantidade
                      </Text>
                      <Text className="text-sm font-semibold">
                        {item.quantity}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm text-muted-foreground flex-1">
                        Preço Unitário
                      </Text>
                      <Text className="text-sm font-semibold">
                        R${' '}
                        {item.priceSnapshot.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm text-muted-foreground flex-1">
                        Subtotal
                      </Text>
                      <Text className="text-sm font-semibold">
                        R${' '}
                        {(item.priceSnapshot * item.quantity).toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </Text>
                    </View>
                  </View>
                </ObjectCard.Content>
              </ObjectCard.Root>
            )}
            ListFooterComponent={<View className="h-4" />}
          />
        </View>
      )}
    </SafeAreaView>
  )
}
