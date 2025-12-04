import { WorkOrderResultItemInput } from '@/src/app/work-orders/form'
import { Button } from '@/src/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Icon } from '@/src/components/ui/icon'
import { Input } from '@/src/components/ui/input'
import { Text } from '@/src/components/ui/text'
import { cn } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import {
  Banknote,
  Check,
  ChevronDown,
  Minus,
  Package,
  Plus,
  Search,
  X,
} from 'lucide-react-native'
import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, View } from 'react-native'

type RemovedProductsComboboxProps = {
  scheduledProducts: Array<{ productId: string; quantity: number }>
  exchangedProducts: WorkOrderResultItemInput[]
  selectedRemovedProducts: WorkOrderResultItemInput[]
  onRemovedProductsChange: (products: WorkOrderResultItemInput[]) => void
  label?: string
  placeholder?: string
  error?: string
  // Para buscar informações completas dos produtos
  availableProducts?: Array<{
    id: string
    name: string
    salePrice: number
  }>
}

export function RemovedProductsCombobox({
  scheduledProducts = [],
  exchangedProducts = [],
  selectedRemovedProducts = [],
  onRemovedProductsChange,
  label = 'Produtos Removidos',
  placeholder = 'Selecione produtos não trocados',
  error,
  availableProducts = [],
}: RemovedProductsComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Produtos removíveis são: agendados - trocados
  const removableProducts = useMemo(() => {
    return scheduledProducts
      .map((sp) => {
        const productInfo = availableProducts.find((p) => p.id === sp.productId)
        if (!productInfo) return null

        // Quantidade já trocada
        const exchangedQty =
          exchangedProducts.find((p) => p.productId === sp.productId)
            ?.quantity || 0

        // Quantidade já removida
        const removedQty =
          selectedRemovedProducts.find((p) => p.productId === sp.productId)
            ?.quantity || 0

        // Quantidade máxima que pode ser removida = agendada - trocada - já removida
        const maxRemovableQty = sp.quantity - exchangedQty - removedQty

        // Permite que produtos já selecionados continuem aparecendo na lista
        const isSelected = selectedRemovedProducts.some(
          (p) => p.productId === sp.productId
        )

        // Remove apenas se não tiver disponibilidade E não estiver selecionado
        if (maxRemovableQty <= 0 && !isSelected) return null

        return {
          productId: sp.productId,
          productName: productInfo.name,
          quantity: sp.quantity,
          maxRemovableQuantity: maxRemovableQty,
          priceSnapshot: productInfo.salePrice,
        }
      })
      .filter(Boolean) as Array<{
      productId: string
      productName: string
      quantity: number
      maxRemovableQuantity: number
      priceSnapshot: number
    }>
  }, [
    scheduledProducts,
    exchangedProducts,
    selectedRemovedProducts,
    availableProducts,
  ])

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return removableProducts
    return removableProducts.filter((p) =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [removableProducts, searchQuery])

  const isProductRemoved = (productId: string) => {
    return selectedRemovedProducts.some((p) => p.productId === productId)
  }

  const getProductQuantity = (productId: string) => {
    const product = selectedRemovedProducts.find(
      (p) => p.productId === productId
    )
    return product?.quantity || 1
  }

  const updateProductQuantity = (productId: string, quantity: number) => {
    const productInfo = removableProducts.find((p) => p.productId === productId)
    if (!productInfo) return

    // Calcular o máximo real: quantidade agendada - quantidade trocada
    const exchangedQty =
      exchangedProducts.find((p) => p.productId === productId)?.quantity || 0
    const maxQuantity = productInfo.quantity - exchangedQty

    if (quantity <= 0) {
      onRemovedProductsChange(
        selectedRemovedProducts.filter((p) => p.productId !== productId)
      )
    } else if (quantity > maxQuantity) {
      // Não permite exceder a quantidade disponível (agendada - trocada)
      return
    } else {
      onRemovedProductsChange(
        selectedRemovedProducts.map((p) =>
          p.productId === productId ? { ...p, quantity } : p
        )
      )
    }
  }

  const toggleProduct = (product: {
    productId: string
    productName: string
    quantity: number
    maxRemovableQuantity: number
    priceSnapshot: number
  }) => {
    if (isProductRemoved(product.productId)) {
      onRemovedProductsChange(
        selectedRemovedProducts.filter((p) => p.productId !== product.productId)
      )
    } else {
      onRemovedProductsChange([
        ...selectedRemovedProducts,
        {
          productId: product.productId,
          productName: product.productName,
          quantity: 1,
          priceSnapshot: product.priceSnapshot,
        },
      ])
    }
  }

  const selectedProductsText = useMemo(() => {
    if (selectedRemovedProducts.length === 0) return placeholder
    if (selectedRemovedProducts.length === 1) {
      const qty = selectedRemovedProducts[0].quantity
      const name = selectedRemovedProducts[0].productName
      return `${name}${qty > 1 ? ` (${qty}x)` : ''}`
    }
    const totalQty = selectedRemovedProducts.reduce(
      (sum, p) => sum + p.quantity,
      0
    )
    return `${selectedRemovedProducts.length} produtos (${totalQty} itens)`
  }, [selectedRemovedProducts, placeholder])

  const renderProductItem = ({
    item,
  }: {
    item: {
      productId: string
      productName: string
      quantity: number
      maxRemovableQuantity: number
      priceSnapshot: number
    }
  }) => {
    const selected = isProductRemoved(item.productId)
    const quantity = getProductQuantity(item.productId)

    // Calcular o máximo real: quantidade agendada - quantidade trocada
    const exchangedQty =
      exchangedProducts.find((p) => p.productId === item.productId)?.quantity ||
      0
    const maxQuantity = item.quantity - exchangedQty

    return (
      <View className="min-h-[120px]">
        <Pressable
          onPress={() => {
            // Só adiciona o produto se não estiver selecionado
            if (!selected) {
              toggleProduct(item)
            }
          }}
          className={cn(
            'p-4 border-b border-border',
            selected && 'bg-accent/50'
          )}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="font-semibold text-base mb-1">
                {item.productName}
              </Text>

              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center gap-1">
                  <Icon as={Banknote} size={16} className="text-green-600" />
                  <Text className="text-sm">
                    R${' '}
                    {item.priceSnapshot.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1">
                  <Icon as={Package} size={16} className="text-blue-600" />
                  <Text className="text-sm">
                    Disponível: {item.maxRemovableQuantity}x
                  </Text>
                </View>
              </View>
            </View>

            {selected && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation()
                  toggleProduct(item)
                }}
                className="bg-primary rounded-full p-1"
              >
                <Icon
                  as={Check}
                  size={16}
                  className="text-primary-foreground"
                />
              </Pressable>
            )}
          </View>

          {/* Controle de quantidade */}
          {selected && (
            <View className="flex-row items-center gap-3 mt-3 pt-3 border-t border-border">
              <Text className="text-sm font-medium">Qte:</Text>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation()
                    updateProductQuantity(item.productId, quantity - 1)
                  }}
                  className="bg-muted rounded-md p-2"
                >
                  <Icon as={Minus} size={16} className="text-foreground" />
                </Pressable>

                <Text className="text-base font-semibold min-w-[30px] text-center">
                  {quantity}
                </Text>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation()
                    updateProductQuantity(item.productId, quantity + 1)
                  }}
                  className="bg-muted rounded-md p-2"
                  disabled={quantity >= maxQuantity}
                >
                  <Icon
                    as={Plus}
                    size={16}
                    className={cn(
                      'text-foreground',
                      quantity >= maxQuantity && 'text-muted-foreground'
                    )}
                  />
                </Pressable>
              </View>
              <Text className="text-xs text-muted-foreground">
                (máx: {maxQuantity})
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    )
  }

  const hasValue = selectedRemovedProducts.length > 0
  const shouldFloat = hasValue || open
  const animated = useRef(new Animated.Value(shouldFloat ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(animated, {
      toValue: shouldFloat ? 1 : 0,
      duration: 80,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start()
  }, [shouldFloat])

  const labelStyle = {
    position: 'absolute' as const,
    left: 8,
    paddingHorizontal: 2,
    zIndex: 10,
    top: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [-8, -8],
    }),
    fontSize: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [12, 12],
    }),
  }

  return (
    <View className="relative">
      {label && (
        <Animated.Text
          style={labelStyle}
          numberOfLines={1}
          className={cn(
            'bg-background',
            error ? 'text-red-500' : 'text-muted-foreground'
          )}
        >
          {label}
        </Animated.Text>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Pressable
            className={cn(
              'flex-row items-center justify-between h-12 px-4 rounded-md',
              'border bg-background',
              'active:bg-accent',
              error ? 'border-red-500' : 'border-input'
            )}
          >
            <View className="flex-row items-center gap-2 flex-1">
              <Icon
                as={Package}
                size={20}
                className={cn('text-muted-foreground', error && 'text-red-500')}
              />
              <Text
                className={cn(
                  'flex-1',
                  selectedRemovedProducts.length === 0 &&
                    'text-muted-foreground',
                  error && 'text-red-500'
                )}
                numberOfLines={1}
              >
                {selectedProductsText}
              </Text>
            </View>
            <Icon
              as={ChevronDown}
              size={20}
              className={cn('text-muted-foreground', error && 'text-red-500')}
            />
          </Pressable>
        </DialogTrigger>

        <DialogContent className="w-80 h-3/4">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>

          <View className="flex-1">
            <View className="relative mb-4 w-full">
              <Icon
                as={Search}
                className="text-muted-foreground absolute left-3 top-2.5 z-10"
                size={20}
              />
              <Input
                placeholder="Pesquisar por nome..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="pl-10 pr-10 w-full"
              />
              {searchQuery !== '' && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5"
                >
                  <Icon as={X} className="text-muted-foreground" size={20} />
                </Pressable>
              )}
            </View>

            {removableProducts.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted-foreground text-center">
                  {exchangedProducts.length > 0
                    ? 'Todos os produtos agendados foram marcados como trocados'
                    : 'Nenhum produto agendado disponível para remoção'}
                </Text>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted-foreground text-center">
                  Nenhum produto encontrado com esse nome
                </Text>
              </View>
            ) : (
              <View className="flex-1">
                <FlashList
                  data={filteredProducts}
                  renderItem={renderProductItem}
                />
              </View>
            )}
          </View>

          <DialogFooter className="flex-row gap-2">
            <DialogClose asChild className="flex-1">
              <Button variant="outline">
                <Text>Cancelar</Text>
              </Button>
            </DialogClose>
            <DialogClose asChild className="flex-1">
              <Button>
                <Text>Confirmar</Text>
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedRemovedProducts.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-2">
          {selectedRemovedProducts.map((sp) => (
            <View
              key={sp.productId}
              className="flex-row items-center gap-2 bg-accent px-3 py-1.5 rounded-full"
            >
              <Text className="text-sm">
                {sp.productName} {`(${sp.quantity}x)`}
              </Text>
              <Pressable
                onPress={() =>
                  onRemovedProductsChange(
                    selectedRemovedProducts.filter(
                      (p) => p.productId !== sp.productId
                    )
                  )
                }
              >
                <Icon as={X} size={14} className="text-muted-foreground" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View className="min-h-4 justify-center">
        {error && <Text className="ml-2 text-xs text-red-500">{error}</Text>}
      </View>
    </View>
  )
}
