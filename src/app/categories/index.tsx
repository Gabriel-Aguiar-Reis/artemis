import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import { Link, Stack } from 'expo-router'
import {
  EditIcon,
  MoreVerticalIcon,
  Plus,
  TrashIcon,
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import * as React from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CategoriesScreen() {
  const { data: categories, isLoading } = categoryHooks.getCategories()
  const { colorScheme } = useColorScheme()

  const handleCategoryOptions = async (
    categoryId: string,
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
            onPress: async () => {
              await handleDeleteCategory(categoryId, categoryName)
            },
          },
        ],
      },
    })
  }

  // TODO: Sheets aninhadas não estão funcionando corretamente
  // (optar por usar apenas uma), possivelmente usar Alert do rn-reusable
  const handleDeleteCategory = async (
    categoryId: string,
    categoryName: string
  ) => {
    console.log('handleDeleteCategory chamado para:', categoryId, categoryName)
    try {
      const result = await SheetManager.show('confirm-delete-sheet', {
        payload: {
          title: 'Excluir categoria?',
          message: `Tem certeza que deseja excluir a categoria "${categoryName}"? Esta ação não pode ser desfeita.`,
          onConfirm: () => {
            console.log('Excluindo categoria:', categoryId)
            // TODO: Adicionar a lógica de exclusão aqui
            // deleteCategory.mutate(categoryId)
          },
        },
      })
      console.log('SheetManager.show result:', result)
    } catch (error) {
      console.error('Erro ao mostrar sheet:', error)
    }
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
              <Link href="/categories/form" asChild>
                <Button size="icon" variant="outline">
                  <Plus
                    size={24}
                    color={colorScheme === 'dark' ? 'white' : undefined}
                  />
                </Button>
              </Link>
            ),
          }}
        />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhuma categoria cadastrada.{'\n'}
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
            <Link href="/categories/form" asChild>
              <Button size="icon" variant="outline">
                <Plus
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : undefined}
                />
              </Button>
            </Link>
          ),
        }}
      />
      <ScrollView className="flex-1">
        <View className="gap-3 p-4">
          {categories.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-center text-muted-foreground">
                Nenhuma categoria cadastrada.
              </Text>
            </View>
          ) : (
            categories.map((category) => (
              <View
                key={category.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold">
                      {category.name}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Status: {category.isActive ? 'Ativo' : 'Inativo'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      handleCategoryOptions(category.id, category.name)
                    }
                    className="ml-2 rounded-md p-2 active:bg-accent"
                  >
                    <Icon
                      as={MoreVerticalIcon}
                      className="text-muted-foreground"
                    />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
