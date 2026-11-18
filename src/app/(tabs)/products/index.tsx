import {
  productHooks,
  useProductsWithCategoryFiltered,
} from '@/src/application/hooks/product.hooks'
import { usePullToRefresh } from '@/src/application/hooks/use-pull-to-refresh'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import {
  BackToTopButton,
  useBackToTop,
} from '@/src/components/ui/back-to-top-button'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ConfirmDeleteDialog } from '@/src/components/ui/dialog/confirm-delete-dialog'
import { Icon } from '@/src/components/ui/icon'
import { ErrorState, LoadingState } from '@/src/components/ui/list-states'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Text } from '@/src/components/ui/text'
import { ProductWithCategoryDTO } from '@/src/domain/repositories/product/dtos/product-with-category.dto'
import { formatBRL } from '@/src/lib/format'
import { cn, UUID } from '@/src/lib/utils'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import {
  Banknote,
  CalendarClock,
  EditIcon,
  FolderTree,
  TrashIcon,
} from 'lucide-react-native'
import * as React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'

type ProductCardProps = {
  product: ProductWithCategoryDTO
  onOptions: (product: ProductWithCategoryDTO) => void
}

const ProductCard = React.memo(
  function ProductCard({ product, onOptions }: ProductCardProps) {
    return (
      <ObjectCard.Root className="mb-4">
        <ObjectCard.Header>
          <ObjectCard.Title>{product.name}</ObjectCard.Title>
          <ObjectCard.Description>
            <View className="flex-row items-center gap-2">
              <Icon
                as={FolderTree}
                size={16}
                className="text-muted-foreground"
              />
              <Text className="text-muted-foreground">
                {product.categoryName}
              </Text>
            </View>
          </ObjectCard.Description>
          <ObjectCard.Actions onPress={() => onOptions(product)} />
        </ObjectCard.Header>
        <ObjectCard.Content>
          <View className="flex-row items-center justify-between gap-2">
            <View>
              <View className="flex-row gap-2 items-center">
                <Icon as={Banknote} size={20} className="text-success" />
                <Text>{formatBRL(product.salePrice)}</Text>
              </View>
              <View className="flex-row gap-2 items-center">
                <Icon as={CalendarClock} size={20} className="text-warning" />
                <Text>{product.expiration}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <View
                className={cn(
                  'h-2 w-2 rounded-full',
                  product.isActive ? 'bg-success' : 'bg-gray-400'
                )}
              />
              <Text className="text-sm text-muted-foreground">
                {product.isActive ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>
        </ObjectCard.Content>
      </ObjectCard.Root>
    )
  },
  (prev, next) =>
    prev.onOptions === next.onOptions &&
    prev.product.id === next.product.id &&
    prev.product.name === next.product.name &&
    prev.product.categoryName === next.product.categoryName &&
    prev.product.salePrice === next.product.salePrice &&
    prev.product.isActive === next.product.isActive &&
    prev.product.expiration === next.product.expiration
)

const keyExtractor = (item: ProductWithCategoryDTO) => item.id

export default function ProductsScreen() {
  const params = useLocalSearchParams<{
    search?: string
    salePriceMin?: string
    salePriceMax?: string
    status?: 'all' | 'active' | 'inactive'
    categoryName?: string
    expiration?: string
  }>()

  const filters = {
    search: params.search,
    salePriceMin: params.salePriceMin,
    salePriceMax: params.salePriceMax,
    status: params.status,
    categoryName: params.categoryName,
    expiration: params.expiration,
  }

  const {
    data: products,
    isLoading,
    isError,
    refetch,
  } = useProductsWithCategoryFiltered(filters)
  const { mutateAsync: deleteProduct, isPending: isDeleting } =
    productHooks.deleteProduct()
  const { refreshing, onRefresh } = usePullToRefresh(refetch)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{
    id: UUID
    name: string
  } | null>(null)

  // Data already comes filtered from the server via repository
  const displayedProducts = products || []

  const hasActiveFilters =
    !!params.search ||
    !!params.salePriceMin ||
    !!params.salePriceMax ||
    (params.status && params.status !== 'all') ||
    !!params.categoryName ||
    !!params.expiration

  const activeFilters = useMemo(() => {
    const filters = []
    if (params.search) {
      filters.push({ label: 'Pesquisa', value: params.search })
    }
    if (params.salePriceMin) {
      filters.push({
        label: 'Preço Mínimo',
        value: formatBRL(Number(params.salePriceMin)),
      })
    }
    if (params.salePriceMax) {
      filters.push({
        label: 'Preço Máximo',
        value: formatBRL(Number(params.salePriceMax)),
      })
    }
    if (params.categoryName) {
      filters.push({ label: 'Categoria', value: params.categoryName })
    }
    if (params.expiration) {
      filters.push({ label: 'Validade', value: params.expiration })
    }
    if (params.status && params.status !== 'all') {
      filters.push({
        label: 'Status',
        value: params.status === 'active' ? 'Ativo' : 'Inativo',
      })
    }
    return filters
  }, [
    params.search,
    params.salePriceMin,
    params.salePriceMax,
    params.status,
    params.categoryName,
    params.expiration,
  ])

  const {
    listRef,
    isVisible: showScrollBtn,
    onScroll,
  } = useBackToTop<FlashListRef<ProductWithCategoryDTO>>()

  const handleProductOptions = useCallback(
    async (product: ProductWithCategoryDTO) => {
      await SheetManager.show('options-sheet', {
        payload: {
          title: product.name,
          options: [
            {
              label: 'Editar',
              icon: EditIcon,
              onPress: () => {
                router.push(`/products/${product.id}/edit`)
              },
            },
            {
              label: 'Excluir',
              icon: TrashIcon,
              destructive: true,
              onPress: () => {
                setSelectedProduct({ id: product.id, name: product.name })
                setDeleteDialogOpen(true)
              },
            },
          ],
        },
      })
    },
    []
  )

  const handleDeleteProduct = async (productId: UUID) => {
    try {
      await deleteProduct(productId)
    } catch {
      // error toast (with a friendly message for FK) comes from the hook
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const renderItem = useCallback(
    ({ item }: { item: ProductWithCategoryDTO }) => (
      <ProductCard product={item} onOptions={handleProductOptions} />
    ),
    [handleProductOptions]
  )

  if (isLoading) {
    return (
      <SafeAreaView edges={['left', 'right']} className="flex-1">
        <LoadingState label="Carregando produtos..." />
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <SafeAreaView edges={['left', 'right']} className="flex-1">
        <ErrorState
          message="Não foi possível carregar os produtos."
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    )
  }

  const hasNoProducts = displayedProducts.length === 0 && !hasActiveFilters

  return (
    <SafeAreaView edges={['left', 'right']} className="flex-1">
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
                    salePriceMin: params.salePriceMin,
                    salePriceMax: params.salePriceMax,
                    status: params.status,
                    categoryName: params.categoryName,
                    expiration: params.expiration,
                  },
                }}
                isActive={hasActiveFilters}
              />
              <ButtonNew href="/products/form" />
            </View>
          ),
        }}
      />
      {hasNoProducts ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhum produto cadastrado.{' \n'}
            Clique no + para adicionar.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <FlashList
            ref={listRef}
            data={displayedProducts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 64 }}
            ListHeaderComponent={
              <View className="-mx-4">
                <ActiveFiltersBanner
                  filters={activeFilters}
                  clearFiltersHref="/products"
                />
              </View>
            }
            ListEmptyComponent={
              <View className="items-center py-12">
                <Text className="text-center text-muted-foreground">
                  Nenhum produto encontrado com os filtros aplicados.
                </Text>
              </View>
            }
          />

          <BackToTopButton isVisible={showScrollBtn} scrollRef={listRef} />
          {selectedProduct && (
            <ConfirmDeleteDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              title={`Excluir produto "${selectedProduct.name}"?`}
              isPending={isDeleting}
              handleDelete={() => handleDeleteProduct(selectedProduct.id)}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  )
}
