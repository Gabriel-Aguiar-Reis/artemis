import {
  categoryHooks,
  useCategoriesFiltered,
} from '@/src/application/hooks/category.hooks'
import { usePersistedTabFilters } from '@/src/application/hooks/use-persisted-tab-filters'
import { usePullToRefresh } from '@/src/application/hooks/use-pull-to-refresh'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import {
  BackToTopButton,
  useBackToTop,
} from '@/src/components/ui/back-to-top-button'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ConfirmDeleteDialog } from '@/src/components/ui/dialog/confirm-delete-dialog'
import { ErrorState, LoadingState } from '@/src/components/ui/list-states'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Text } from '@/src/components/ui/text'
import { Category } from '@/src/domain/entities/category/category.entity'
import { cn, UUID } from '@/src/lib/utils'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { EditIcon, TrashIcon } from 'lucide-react-native'
import * as React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'

type CategoryCardProps = {
  category: Category
  onOptions: (category: Category) => void
}

const CategoryCard = React.memo(
  function CategoryCard({ category, onOptions }: CategoryCardProps) {
    return (
      <ObjectCard.Root className="mb-4">
        <ObjectCard.Header>
          <ObjectCard.Title>{category.name}</ObjectCard.Title>
          <ObjectCard.Actions onPress={() => onOptions(category)} />
        </ObjectCard.Header>
        <ObjectCard.Content>
          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                'h-2 w-2 rounded-full',
                category.isActive ? 'bg-success' : 'bg-gray-400'
              )}
            />
            <Text className="text-sm text-muted-foreground">
              {category.isActive ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </ObjectCard.Content>
      </ObjectCard.Root>
    )
  },
  (prev, next) =>
    prev.onOptions === next.onOptions &&
    prev.category.id === next.category.id &&
    prev.category.name === next.category.name &&
    prev.category.isActive === next.category.isActive
)

const keyExtractor = (item: Category) => item.id

export default function CategoriesScreen() {
  const params = useLocalSearchParams<{
    search?: string
    status?: 'all' | 'active' | 'inactive'
  }>()
  // Filters survive closing the app
  usePersistedTabFilters('categories', params)

  const filters = {
    search: params.search,
    status: params.status || 'all',
  }

  const {
    data: allCategories,
    isLoading,
    isError,
    refetch,
  } = useCategoriesFiltered(filters)
  const { mutateAsync: deleteCategory, isPending: isDeleting } =
    categoryHooks.deleteCategory()
  const { refreshing, onRefresh } = usePullToRefresh(refetch)

  const displayedCategories = allCategories || []

  const hasActiveFilters =
    !!params.search || (params.status && params.status !== 'all')

  const activeFilters = useMemo(() => {
    const filters = []
    if (params.search) {
      filters.push({ label: 'Pesquisa', value: params.search })
    }
    if (params.status && params.status !== 'all') {
      filters.push({
        label: 'Status',
        value: params.status === 'active' ? 'Ativo' : 'Inativo',
      })
    }
    return filters
  }, [params.search, params.status])

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<{
    id: UUID
    name: string
  } | null>(null)

  const {
    listRef,
    isVisible: showScrollBtn,
    onScroll,
  } = useBackToTop<FlashListRef<Category>>()

  const handleCategoryOptions = useCallback(async (category: Category) => {
    await SheetManager.show('options-sheet', {
      payload: {
        title: category.name,
        options: [
          {
            label: 'Editar',
            icon: EditIcon,
            onPress: () => {
              router.push(`/categories/${category.id}/edit`)
            },
          },
          {
            label: 'Excluir',
            icon: TrashIcon,
            destructive: true,
            onPress: () => {
              setSelectedCategory({ id: category.id, name: category.name })
              setDeleteDialogOpen(true)
            },
          },
        ],
      },
    })
  }, [])

  const handleDeleteCategory = async (categoryId: UUID) => {
    try {
      await deleteCategory(categoryId)
    } catch {
      // error toast (with a friendly message for FK) comes from the hook
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const renderItem = useCallback(
    ({ item }: { item: Category }) => (
      <CategoryCard category={item} onOptions={handleCategoryOptions} />
    ),
    [handleCategoryOptions]
  )

  if (isLoading) {
    return (
      <SafeAreaView edges={['left', 'right']} className="flex-1">
        <LoadingState label="Carregando categorias..." />
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <SafeAreaView edges={['left', 'right']} className="flex-1">
        <ErrorState
          message="Não foi possível carregar as categorias."
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    )
  }

  const hasNoCategories = displayedCategories.length === 0 && !hasActiveFilters

  return (
    <SafeAreaView edges={['left', 'right']} className="flex-1">
      <Stack.Screen
        options={{
          title: 'Categorias',
          headerRight: () => (
            <View className="flex-row gap-2">
              <ButtonFilter
                href={{
                  pathname: '/categories/search',
                  params: {
                    search: params.search,
                    status: params.status,
                  },
                }}
                isActive={hasActiveFilters}
              />
              <ButtonNew href="/categories/form" />
            </View>
          ),
        }}
      />
      {hasNoCategories ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhuma categoria cadastrada.{' \n'}
            Clique no + para adicionar.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <FlashList
            ref={listRef}
            data={displayedCategories}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 64,
            }}
            ListHeaderComponent={
              <View className="-mx-4">
                <ActiveFiltersBanner
                  filters={activeFilters}
                  clearFiltersHref="/categories"
                />
              </View>
            }
            ListEmptyComponent={
              <View className="items-center py-12">
                <Text className="text-center text-muted-foreground">
                  Nenhuma categoria encontrada com os filtros aplicados.
                </Text>
              </View>
            }
          />

          <BackToTopButton isVisible={showScrollBtn} scrollRef={listRef} />
          {selectedCategory && (
            <ConfirmDeleteDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              title={`Excluir categoria "${selectedCategory.name}"?`}
              isPending={isDeleting}
              handleDelete={() => handleDeleteCategory(selectedCategory.id)}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  )
}
