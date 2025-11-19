import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ConfirmDeleteDialog } from '@/src/components/ui/dialog/confirm-delete-dialog'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Text } from '@/src/components/ui/text'
import { Category } from '@/src/domain/entities/category/category.entity'
import { cn, smartSearch } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { UUID } from 'crypto'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { EditIcon, TrashIcon } from 'lucide-react-native'
import * as React from 'react'
import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function CategoriesScreen() {
  const { data: categories, isLoading } = categoryHooks.getCategories()
  const { mutate: deleteCategory } = categoryHooks.deleteCategory()

  const params = useLocalSearchParams<{
    search?: string
    status?: 'all' | 'active' | 'inactive'
  }>()

  const filteredCategories = useMemo(() => {
    if (!categories) return []

    return categories.filter((category) => {
      const matchesSearch = params.search
        ? smartSearch(category.name, params.search)
        : true

      const matchesStatus =
        !params.status ||
        params.status === 'all' ||
        (params.status === 'active' && category.isActive) ||
        (params.status === 'inactive' && !category.isActive)

      return matchesSearch && matchesStatus
    })
  }, [categories, params.search, params.status])

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
        value: params.status === 'active' ? 'Ativos' : 'Inativos',
      })
    }
    return filters
  }, [params.search, params.status])

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<{
    id: UUID
    name: string
  } | null>(null)

  const handleCategoryOptions = async (
    categoryId: UUID,
    categoryName: string
  ) => {
    await SheetManager.show('options-sheet', {
      payload: {
        title: categoryName,
        options: [
          {
            label: 'Editar',
            icon: EditIcon,
            onPress: () => {
              router.push(`/categories/${categoryId}/edit`)
            },
          },
          {
            label: 'Excluir',
            icon: TrashIcon,
            destructive: true,
            onPress: () => {
              setSelectedCategory({ id: categoryId, name: categoryName })
              setDeleteDialogOpen(true)
            },
          },
        ],
      },
    })
  }

  const handleDeleteCategory = (categoryId: UUID) => {
    deleteCategory(categoryId)
    setDeleteDialogOpen(false)
    Toast.show({
      type: 'success',
      text1: 'Categoria excluída com sucesso!',
      props: { icon: TrashIcon },
    })
  }

  const renderItem = (category: Category) => {
    return (
      <ObjectCard.Root key={category.id} className="mb-4">
        <ObjectCard.Header>
          <ObjectCard.Title>{category.name}</ObjectCard.Title>
          <ObjectCard.Actions
            onPress={() => handleCategoryOptions(category.id, category.name)}
          />
        </ObjectCard.Header>
        <ObjectCard.Content>
          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                'h-2 w-2 rounded-full',
                category.isActive ? 'bg-green-500' : 'bg-gray-400'
              )}
            />
            <Text className="text-sm text-muted-foreground">
              {category.isActive ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </ObjectCard.Content>
      </ObjectCard.Root>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando categorias...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1">
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
      {!categories || categories.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhuma categoria cadastrada.{' \n'}
            Clique no + para adicionar.
          </Text>
        </View>
      ) : (
        <>
          <ActiveFiltersBanner
            filters={activeFilters}
            clearFiltersHref="/categories"
          />
          <ScrollView className="flex-1">
            <View className="gap-3 p-4">
              {filteredCategories.length === 0 ? (
                <View className="items-center py-12">
                  <Text className="text-center text-muted-foreground">
                    Nenhuma categoria encontrada com os filtros aplicados.
                  </Text>
                </View>
              ) : (
                <FlashList
                  data={filteredCategories}
                  renderItem={({ item }) => renderItem(item)}
                />
              )}
            </View>
          </ScrollView>
          {selectedCategory && (
            <ConfirmDeleteDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              title={`Excluir categoria "${selectedCategory.name}"?`}
              handleDelete={() => {
                handleDeleteCategory(selectedCategory.id)
              }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  )
}
