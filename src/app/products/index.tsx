import { productHooks } from '@/src/application/hooks/product.hooks'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import { BackToTopButton } from '@/src/components/ui/back-to-top-button'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ConfirmDeleteDialog } from '@/src/components/ui/dialog/confirm-delete-dialog'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Text } from '@/src/components/ui/text'
import { Product } from '@/src/domain/entities/product/product.entity'
import { cn } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { UUID } from 'crypto'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { EditIcon, TrashIcon } from 'lucide-react-native'
import * as React from 'react'
import { useMemo, useRef, useState } from 'react'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProductsScreen() {
  const { data: products, isLoading } = productHooks.getProducts()
  const { mutate: deleteProduct } = productHooks.deleteProduct()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{
    id: UUID
    name: string
  } | null>(null)

  const params = useLocalSearchParams<{
    search?: string
    salePriceMin?: string
    salePriceMax?: string
    status?: 'all' | 'active' | 'inactive'
  }>()

  const filteredProducts = useMemo(() => {
    if (!products) return []
    return products.filter((product) => {
      const matchesSearch = params.search
        ? product.name.includes(params.search)
        : true
      const matchesSalePriceMin = params.salePriceMin
        ? product.salePrice >= Number(params.salePriceMin)
        : true
      const matchesSalePriceMax = params.salePriceMax
        ? product.salePrice <= Number(params.salePriceMax)
        : true

      const matchesStatus =
        !params.status ||
        params.status === 'all' ||
        (params.status === 'active' && product.isActive) ||
        (params.status === 'inactive' && !product.isActive)
      return (
        matchesSearch &&
        matchesSalePriceMin &&
        matchesSalePriceMax &&
        matchesStatus
      )
    })
  }, [
    products,
    params.search,
    params.salePriceMin,
    params.salePriceMax,
    params.status,
  ])

  const hasActiveFilters =
    !!params.search ||
    !!params.salePriceMin ||
    !!params.salePriceMax ||
    (params.status && params.status !== 'all')

  const activeFilters = useMemo(() => {
    const filters = []
    if (params.search) {
      filters.push({ label: 'Search', value: params.search })
    }
    if (params.salePriceMin) {
      filters.push({ label: 'Min Sale Price', value: params.salePriceMin })
    }
    if (params.salePriceMax) {
      filters.push({ label: 'Max Sale Price', value: params.salePriceMax })
    }
    if (params.status && params.status !== 'all') {
      filters.push({
        label: 'Status',
        value: params.status === 'active' ? 'Active' : 'Inactive',
      })
    }
    return filters
  }, [params.search, params.salePriceMin, params.salePriceMax, params.status])

  // Adicionado useRef e useState para ScrollView e botão de voltar ao topo
  const scrollRef = useRef<ScrollView>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y
    setShowScrollBtn(offsetY > 0)
  }

  const handleProductOptions = async (productId: UUID, productName: string) => {
    await SheetManager.show('options-sheet', {
      payload: {
        title: productName,
        options: [
          {
            label: 'Editar',
            icon: EditIcon,
            onPress: () => {
              router.push(`/products/${productId}/edit`)
            },
          },
          {
            label: 'Excluir',
            icon: TrashIcon,
            destructive: true,
            onPress: () => {
              setSelectedProduct({ id: productId, name: productName })
              setDeleteDialogOpen(true)
            },
          },
        ],
      },
    })
  }

  const handleDeleteProduct = (productId: UUID) => {
    deleteProduct(productId)
    setDeleteDialogOpen(false)
  }

  const renderItem = (product: Product) => {
    return (
      <ObjectCard.Root key={product.id} className="mb-4">
        <ObjectCard.Header>
          <ObjectCard.Title>{product.name}</ObjectCard.Title>
          <ObjectCard.Actions
            onPress={() => handleProductOptions(product.id, product.name)}
          />
        </ObjectCard.Header>
        <ObjectCard.Content>
          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                'h-2 w-2 rounded-full',
                product.isActive ? 'bg-green-500' : 'bg-gray-400'
              )}
            />
            <Text className="text-sm text-muted-foreground">
              {product.isActive ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </ObjectCard.Content>
      </ObjectCard.Root>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando Produtos...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Produtos',
          headerRight: () => (
            <View className="flex-row gap-2">
              <ButtonFilter
                href={{
                  pathname: '/products/search',
                  params: {
                    search: params.search,
                    status: params.status,
                  },
                }}
                isActive={hasActiveFilters}
              />
              <ButtonNew href="/products/form" />
            </View>
          ),
        }}
      />
      {!products || products.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhum produto cadastrado.{' \n'}
            Clique no + para adicionar.
          </Text>
        </View>
      ) : (
        <>
          <ActiveFiltersBanner
            filters={activeFilters}
            clearFiltersHref="/products"
          />
          <ScrollView
            className="flex-1"
            ref={scrollRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View className="gap-3 p-4">
              {filteredProducts.length === 0 ? (
                <View className="items-center py-12">
                  <Text className="text-center text-muted-foreground">
                    Nenhum produto encontrado com os filtros aplicados.
                  </Text>
                </View>
              ) : (
                <FlashList
                  data={filteredProducts}
                  renderItem={({ item }) => renderItem(item)}
                  ListFooterComponent={<View className="h-16" />}
                />
              )}
            </View>
          </ScrollView>

          {/* Botão de voltar ao topo */}
          <BackToTopButton isVisible={showScrollBtn} scrollRef={scrollRef} />
          {selectedProduct && (
            <ConfirmDeleteDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              title={`Excluir produto "${selectedProduct.name}"?`}
              handleDelete={() => {
                handleDeleteProduct(selectedProduct.id)
              }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  )
}
