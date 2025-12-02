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
  CheckCircle2,
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

type ExchangedProductsComboboxProps = {
  scheduledProducts: Array<{ productId: string; quantity: number }>
  selectedExchangedProducts: WorkOrderResultItemInput[]
  onExchangedProductsChange: (products: WorkOrderResultItemInput[]) => void
  label?: string
  placeholder?: string
  // Para buscar informações completas dos produtos
  availableProducts?: Array<{
    id: string
    name: string
    salePrice: number
  }>
}

export function ExchangedProductsCombobox({
  scheduledProducts = [],
  selectedExchangedProducts = [],
  onExchangedProductsChange,
  label = 'Produtos Trocados',
  placeholder = 'Selecione dos produtos agendados',
  availableProducts = [],
}: ExchangedProductsComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Mapear produtos agendados com suas informações completas
  const scheduledProductsWithInfo = useMemo(() => {
    return scheduledProducts
      .map((sp) => {
        const productInfo = availableProducts.find((p) => p.id === sp.productId)
        if (!productInfo) return null
        return {
          ...sp,
          productName: productInfo.name,
          priceSnapshot: productInfo.salePrice,
        }
      })
      .filter(Boolean) as Array<{
      productId: string
      quantity: number
      productName: string
      priceSnapshot: number
    }>
  }, [scheduledProducts, availableProducts])

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return scheduledProductsWithInfo
    return scheduledProductsWithInfo.filter((p) =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [scheduledProductsWithInfo, searchQuery])

  const isProductExchanged = (productId: string) => {
    return selectedExchangedProducts.some((p) => p.productId === productId)
  }

  const getProductQuantity = (productId: string) => {
    const product = selectedExchangedProducts.find(
      (p) => p.productId === productId
    )
    return product?.quantity || 1
  }

  const updateProductQuantity = (productId: string, quantity: number) => {
    const maxQuantity =
      scheduledProductsWithInfo.find((p) => p.productId === productId)
        ?.quantity || 1

    if (quantity <= 0) {
      onExchangedProductsChange(
        selectedExchangedProducts.filter((p) => p.productId !== productId)
      )
    } else if (quantity > maxQuantity) {
      // Não permite exceder a quantidade agendada
      return
    } else {
      onExchangedProductsChange(
        selectedExchangedProducts.map((p) =>
          p.productId === productId ? { ...p, quantity } : p
        )
      )
    }
  }

  const toggleProduct = (product: {
    productId: string
    quantity: number
    productName: string
    priceSnapshot: number
  }) => {
    if (isProductExchanged(product.productId)) {
      onExchangedProductsChange(
        selectedExchangedProducts.filter(
          (p) => p.productId !== product.productId
        )
      )
    } else {
      onExchangedProductsChange([
        ...selectedExchangedProducts,
        {
          productId: product.productId,
          productName: product.productName,
          quantity: 1,
          priceSnapshot: product.priceSnapshot,
        },
      ])
    }
  }

  const markAllAsExchanged = () => {
    // Criar WorkOrderResultItemInput para todos os produtos agendados
    const allExchanged: WorkOrderResultItemInput[] =
      scheduledProductsWithInfo.map((product) => ({
        productId: product.productId,
        productName: product.productName,
        quantity: product.quantity, // Usa a quantidade total agendada
        priceSnapshot: product.priceSnapshot,
      }))

    onExchangedProductsChange(allExchanged)
    setOpen(false)
  }

  const selectedProductsText = useMemo(() => {
    if (selectedExchangedProducts.length === 0) return placeholder
    if (selectedExchangedProducts.length === 1) {
      const qty = selectedExchangedProducts[0].quantity
      const name = selectedExchangedProducts[0].productName
      return `${name}${qty > 1 ? ` (${qty}x)` : ''}`
    }
    const totalQty = selectedExchangedProducts.reduce(
      (sum, p) => sum + p.quantity,
      0
    )
    return `${selectedExchangedProducts.length} produtos (${totalQty} itens)`
  }, [selectedExchangedProducts, placeholder])

  const renderProductItem = ({
    item,
  }: {
    item: {
      productId: string
      quantity: number
      productName: string
      priceSnapshot: number
    }
  }) => {
    const selected = isProductExchanged(item.productId)
    const quantity = getProductQuantity(item.productId)

    return (
      <View className="min-h-[120px]">
        <Pressable
          onPress={() => toggleProduct(item)}
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
                  <Text className="text-sm">Agendado: {item.quantity}x</Text>
                </View>
              </View>
            </View>

            {selected && (
              <View className="bg-primary rounded-full p-1">
                <Icon
                  as={Check}
                  size={16}
                  className="text-primary-foreground"
                />
              </View>
            )}
          </View>

          {/* Controle de quantidade */}
          {selected && (
            <View className="flex-row items-center gap-3 mt-3 pt-3 border-t border-border">
              <Text className="text-sm font-medium">Quantidade trocada:</Text>
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
                  disabled={quantity >= item.quantity}
                >
                  <Icon
                    as={Plus}
                    size={16}
                    className={cn(
                      'text-foreground',
                      quantity >= item.quantity && 'text-muted-foreground'
                    )}
                  />
                </Pressable>
              </View>
              <Text className="text-xs text-muted-foreground">
                (máx: {item.quantity})
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    )
  }

  const hasValue = selectedExchangedProducts.length > 0
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
          className="bg-background text-muted-foreground"
        >
          {label}
        </Animated.Text>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Pressable
            className={cn(
              'flex-row items-center justify-between h-12 px-4 rounded-md',
              'border border-input bg-background',
              'active:bg-accent'
            )}
          >
            <View className="flex-row items-center gap-2 flex-1">
              <Icon as={Package} size={20} className="text-muted-foreground" />
              <Text
                className={cn(
                  'flex-1',
                  selectedExchangedProducts.length === 0 &&
                    'text-muted-foreground'
                )}
                numberOfLines={1}
              >
                {selectedProductsText}
              </Text>
            </View>
            <Icon
              as={ChevronDown}
              size={20}
              className="text-muted-foreground"
            />
          </Pressable>
        </DialogTrigger>

        <DialogContent className="w-80 h-3/4">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>

          <View className="flex-1">
            {/* Botão para marcar todos como trocados */}
            {scheduledProductsWithInfo.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onPress={markAllAsExchanged}
                className="mb-4"
              >
                <Icon
                  as={CheckCircle2}
                  size={16}
                  className="text-foreground mr-2"
                />
                <Text>Marcar Todos Como Trocados</Text>
              </Button>
            )}

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

            {scheduledProductsWithInfo.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted-foreground text-center">
                  Nenhum produto agendado para esta ordem de serviço
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

      {selectedExchangedProducts.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-2">
          {selectedExchangedProducts.map((sp) => (
            <View
              key={sp.productId}
              className="flex-row items-center gap-2 bg-accent px-3 py-1.5 rounded-full"
            >
              <Text className="text-sm">
                {sp.productName} {`(${sp.quantity}x)`}
              </Text>
              <Pressable
                onPress={() =>
                  onExchangedProductsChange(
                    selectedExchangedProducts.filter(
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

      <View className="min-h-4" />
    </View>
  )
}
