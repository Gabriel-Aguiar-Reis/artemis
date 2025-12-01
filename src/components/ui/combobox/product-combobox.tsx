import { productHooks } from '@/src/application/hooks/product.hooks'
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
import { ProductWithCategoryDTO } from '@/src/domain/repositories/product/dtos/product-with-category.dto'
import { cn } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import {
  Banknote,
  CalendarClock,
  Check,
  ChevronDown,
  FolderTree,
  Minus,
  Package,
  Plus,
  Search,
  X,
} from 'lucide-react-native'
import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, View } from 'react-native'

type ProductComboboxProps = {
  selectedProducts: Array<{ productId: string; quantity: number }>
  onProductsChange: (
    products: Array<{ productId: string; quantity: number }>
  ) => void
  label?: string
  placeholder?: string
  multiple?: boolean
}

export function ProductCombobox({
  selectedProducts = [],
  onProductsChange,
  label = 'Produtos',
  placeholder = 'Selecione produtos',
  multiple = true,
}: ProductComboboxProps) {
  const { data: products = [], isLoading } =
    productHooks.getProductsWithCategory()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

  const isProductSelected = (productId: string) => {
    return selectedProducts.some((p) => p.productId === productId)
  }

  const getProductQuantity = (productId: string) => {
    const product = selectedProducts.find((p) => p.productId === productId)
    return product?.quantity || 1
  }

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      onProductsChange(
        selectedProducts.filter((p) => p.productId !== productId)
      )
    } else {
      onProductsChange(
        selectedProducts.map((p) =>
          p.productId === productId ? { ...p, quantity } : p
        )
      )
    }
  }

  const toggleProduct = (product: ProductWithCategoryDTO) => {
    if (multiple) {
      if (isProductSelected(product.id)) {
        onProductsChange(
          selectedProducts.filter((p) => p.productId !== product.id)
        )
      } else {
        onProductsChange([
          ...selectedProducts,
          { productId: product.id, quantity: 1 },
        ])
      }
    } else {
      onProductsChange([{ productId: product.id, quantity: 1 }])
      setOpen(false)
    }
  }

  const selectedProductsText = useMemo(() => {
    if (selectedProducts.length === 0) return placeholder
    if (selectedProducts.length === 1) {
      const product = products.find(
        (p) => p.id === selectedProducts[0].productId
      )
      const qty = selectedProducts[0].quantity
      return product
        ? `${product.name}${qty > 1 ? ` (${qty}x)` : ''}`
        : placeholder
    }
    const totalQty = selectedProducts.reduce((sum, p) => sum + p.quantity, 0)
    return `${selectedProducts.length} produtos (${totalQty} itens)`
  }, [selectedProducts, products, placeholder])

  const renderProductItem = ({ item }: { item: ProductWithCategoryDTO }) => {
    const selected = isProductSelected(item.id)
    const quantity = getProductQuantity(item.id)

    return (
      <View className="min-h-[140px]">
        <Pressable
          onPress={() => toggleProduct(item)}
          className={cn(
            'p-4 border-b border-border',
            selected && 'bg-accent/50'
          )}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="font-semibold text-base mb-1">{item.name}</Text>

              <View className="flex-row items-center gap-2 mb-2">
                <Icon
                  as={FolderTree}
                  size={14}
                  className="text-muted-foreground"
                />
                <Text className="text-sm text-muted-foreground">
                  {item.categoryName}
                </Text>
              </View>

              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center gap-1">
                  <Icon as={Banknote} size={16} className="text-green-600" />
                  <Text className="text-sm">
                    R${' '}
                    {item.salePrice.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1">
                  <Icon
                    as={CalendarClock}
                    size={16}
                    className="text-orange-600"
                  />
                  <Text className="text-sm">{item.expiration}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2 mt-2">
                <View
                  className={cn(
                    'h-2 w-2 rounded-full',
                    item.isActive ? 'bg-green-500' : 'bg-gray-400'
                  )}
                />
                <Text className="text-xs text-muted-foreground">
                  {item.isActive ? 'Ativo' : 'Inativo'}
                </Text>
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
              <Text className="text-sm font-medium">Quantidade:</Text>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation()
                    updateProductQuantity(item.id, quantity - 1)
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
                    updateProductQuantity(item.id, quantity + 1)
                  }}
                  className="bg-muted rounded-md p-2"
                >
                  <Icon as={Plus} size={16} className="text-foreground" />
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </View>
    )
  }

  const hasValue = selectedProducts.length > 0
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
                  selectedProducts.length === 0 && 'text-muted-foreground'
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

            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted-foreground">
                  Carregando produtos...
                </Text>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted-foreground text-center">
                  {searchQuery
                    ? 'Nenhum produto encontrado com esse nome'
                    : 'Nenhum produto cadastrado'}
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

      {selectedProducts.length > 0 && multiple && (
        <View className="flex-row flex-wrap gap-2 mt-2">
          {selectedProducts.map((sp) => {
            const product = products.find((p) => p.id === sp.productId)
            if (!product) return null

            return (
              <View
                key={sp.productId}
                className="flex-row items-center gap-2 bg-accent px-3 py-1.5 rounded-full"
              >
                <Text className="text-sm">
                  {product.name} {`(${sp.quantity}x)`}
                </Text>
                <Pressable
                  onPress={() =>
                    onProductsChange(
                      selectedProducts.filter(
                        (p) => p.productId !== sp.productId
                      )
                    )
                  }
                >
                  <Icon as={X} size={14} className="text-muted-foreground" />
                </Pressable>
              </View>
            )
          })}
        </View>
      )}

      <View className="min-h-4" />
    </View>
  )
}
