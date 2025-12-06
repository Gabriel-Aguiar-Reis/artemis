import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Icon } from '@/src/components/ui/icon'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Text } from '@/src/components/ui/text'
import {
  WorkOrderResultItem,
  WorkOrderResultItemType,
} from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { UUID } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import {
  ArrowLeftRight,
  Banknote,
  Edit,
  Minus,
  Package,
  Plus,
} from 'lucide-react-native'
import { View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'

interface ResultItemWithType {
  item: WorkOrderResultItem
  type: WorkOrderResultItemType
}

export default function WorkOrderResultScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()
  const { data: workOrder, isLoading } = workOrderHooks.getWorkOrder(params.id)

  const handleResultOptions = async () => {
    if (!workOrder?.result) return

    await SheetManager.show('options-sheet', {
      payload: {
        title: 'Opções do Relatório',
        options: [
          {
            label: 'Editar Relatório',
            icon: Edit,
            onPress: () => {
              router.push(
                `/work-orders/${params.id}/result/${workOrder.result!.id}/edit`
              )
            },
          },
        ],
      },
    })
  }

  if (isLoading) {
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

  const result = workOrder.result
  const exchanged = result.exchangedProducts || []
  const added = result.addedProducts || []
  const removed = result.removedProducts || []

  const allItems: ResultItemWithType[] = [
    ...exchanged.map((item) => ({
      item,
      type: WorkOrderResultItemType.EXCHANGED,
    })),
    ...added.map((item) => ({ item, type: WorkOrderResultItemType.ADDED })),
    ...removed.map((item) => ({ item, type: WorkOrderResultItemType.REMOVED })),
  ]

  const getTypeLabel = (type: WorkOrderResultItemType) => {
    switch (type) {
      case WorkOrderResultItemType.EXCHANGED:
        return 'Trocado'
      case WorkOrderResultItemType.ADDED:
        return 'Adicionado'
      case WorkOrderResultItemType.REMOVED:
        return 'Removido'
    }
  }

  const getTypeIcon = (type: WorkOrderResultItemType) => {
    switch (type) {
      case WorkOrderResultItemType.EXCHANGED:
        return ArrowLeftRight
      case WorkOrderResultItemType.ADDED:
        return Plus
      case WorkOrderResultItemType.REMOVED:
        return Minus
    }
  }

  const getTypeColor = (type: WorkOrderResultItemType) => {
    switch (type) {
      case WorkOrderResultItemType.EXCHANGED:
        return 'text-blue-500'
      case WorkOrderResultItemType.ADDED:
        return 'text-green-500'
      case WorkOrderResultItemType.REMOVED:
        return 'text-red-500'
    }
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Relatório do Serviço',
        }}
      />
      <View className="flex-1 p-4">
        <ObjectCard.Root className="mb-4 dark:bg-input/30">
          <ObjectCard.Header>
            <ObjectCard.Title>
              Resumo do Relatório
              {workOrder.paymentOrder && (
                <Text className="text-xs font-medium text-muted-foreground">
                  {' '}
                  - Não pode ser editado
                </Text>
              )}
            </ObjectCard.Title>
            {!workOrder.paymentOrder && (
              <ObjectCard.Actions onPress={handleResultOptions} />
            )}
          </ObjectCard.Header>
          <ObjectCard.Content>
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <Icon
                  as={Banknote}
                  className="text-muted-foreground"
                  size={20}
                />
                <Text className="text-sm text-muted-foreground flex-1">
                  Valor Total
                </Text>
                <Text className="text-sm font-semibold">
                  R${' '}
                  {result.totalValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Icon as={ArrowLeftRight} className="text-blue-500" size={20} />
                <Text className="text-sm text-muted-foreground flex-1">
                  Produtos Trocados
                </Text>
                <Text className="text-sm font-semibold">
                  {exchanged.reduce((sum, item) => sum + item.quantity, 0)}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Icon as={Plus} className="text-green-500" size={20} />
                <Text className="text-sm text-muted-foreground flex-1">
                  Produtos Adicionados
                </Text>
                <Text className="text-sm font-semibold">
                  {added.reduce((sum, item) => sum + item.quantity, 0)}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Icon as={Minus} className="text-red-500" size={20} />
                <Text className="text-sm text-muted-foreground flex-1">
                  Produtos Removidos
                </Text>
                <Text className="text-sm font-semibold">
                  {removed.reduce((sum, item) => sum + item.quantity, 0)}
                </Text>
              </View>
            </View>
          </ObjectCard.Content>
        </ObjectCard.Root>

        {allItems.length > 0 && (
          <>
            <Text className="text-lg font-bold mb-3">Produtos</Text>
            <FlashList
              data={allItems}
              renderItem={({
                item: itemWithType,
              }: {
                item: ResultItemWithType
              }) => {
                const TypeIcon = getTypeIcon(itemWithType.type)
                const item = itemWithType.item
                return (
                  <ObjectCard.Root className="mb-3 dark:bg-input/30">
                    <ObjectCard.Header>
                      <ObjectCard.Title>
                        {item.productSnapshot.productName}
                      </ObjectCard.Title>
                      <ObjectCard.Description>
                        <View className="flex-row items-center gap-1">
                          <Icon
                            as={TypeIcon}
                            className={getTypeColor(itemWithType.type)}
                            size={16}
                          />
                          <Text
                            className={`text-xs font-semibold ${getTypeColor(itemWithType.type)}`}
                          >
                            {getTypeLabel(itemWithType.type)}
                          </Text>
                        </View>
                      </ObjectCard.Description>
                    </ObjectCard.Header>
                    <ObjectCard.Content>
                      <View className="gap-2">
                        <View className="flex-row items-center gap-2">
                          <Icon
                            as={Package}
                            className="text-muted-foreground"
                            size={16}
                          />
                          <Text className="text-sm text-muted-foreground flex-1">
                            Quantidade
                          </Text>
                          <Text className="text-sm font-semibold">
                            {item.quantity}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm text-muted-foreground flex-1 ml-5">
                            Preço Unitário
                          </Text>
                          <Text className="text-sm font-semibold">
                            R${' '}
                            {item.priceSnapshot.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm text-muted-foreground flex-1 ml-5">
                            Subtotal
                          </Text>
                          <Text className="text-sm font-semibold">
                            R${' '}
                            {(
                              item.priceSnapshot * item.quantity
                            ).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </Text>
                        </View>
                      </View>
                    </ObjectCard.Content>
                  </ObjectCard.Root>
                )
              }}
              ListFooterComponent={<View className="h-4" />}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  )
}
