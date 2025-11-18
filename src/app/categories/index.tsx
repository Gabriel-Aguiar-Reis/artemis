import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ConfirmDeleteDialog } from '@/src/components/ui/dialog/confirm-delete-dialog'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Text } from '@/src/components/ui/text'
import { cn } from '@/src/lib/utils'
import { UUID } from 'crypto'
import { Stack, useLocalSearchParams } from 'expo-router'
import { EditIcon, TrashIcon } from 'lucide-react-native'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CategoriesScreen() {
  const { data: categories, isLoading } = categoryHooks.getCategories()
  const { mutate: deleteCategory } = categoryHooks.deleteCategory()

  const params = useLocalSearchParams<{
    search?: string
    status?: 'all' | 'active' | 'inactive'
  }>()

  const filteredCategories = React.useMemo(() => {
    if (!categories) return []

    return categories.filter((category) => {
      const matchesSearch = params.search
        ? category.name.toLowerCase().includes(params.search.toLowerCase())
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

  const activeFilters = React.useMemo(() => {
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

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<{
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
              console.log('Editar categoria:', categoryId)
              // TODO: Navegar para tela de edição
              // router.push(`/categories/form?id=${categoryId}`)
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando categorias...</Text>
      </SafeAreaView>
    )
  }

  if (!categories || categories.length === 0) {
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
                />
                <ButtonNew href="/categories/form" />
              </View>
            ),
          }}
        />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhuma categoria cadastrada.{' \n'}
            Clique no + para adicionar.
          </Text>
        </View>
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
              />
              <ButtonNew href="/categories/form" />
            </View>
          ),
        }}
      />
      <ActiveFiltersBanner
        filters={activeFilters}
        clearFiltersHref="/categories"
      />
      <ScrollView className="flex-1">
        <View className="gap-3 p-4">
          {filteredCategories.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-center text-muted-foreground">
                {hasActiveFilters
                  ? 'Nenhuma categoria encontrada com os filtros aplicados.'
                  : 'Nenhuma categoria cadastrada.'}
              </Text>
            </View>
          ) : (
            filteredCategories.map((category) => (
              <ObjectCard.Root key={category.id}>
                <ObjectCard.Header>
                  <ObjectCard.Title>{category.name}</ObjectCard.Title>
                  <ObjectCard.Actions
                    onPress={() =>
                      handleCategoryOptions(category.id, category.name)
                    }
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
            ))
          )}
        </View>
      </ScrollView>

      {selectedCategory && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={`Excluir categoria "${selectedCategory.name}"?`}
          handleDelete={() => {
            deleteCategory(selectedCategory.id)
            setDeleteDialogOpen(false)
          }}
        />
      )}
    </SafeAreaView>
  )
}
