import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { Link, Stack } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CategoriesScreen() {
  const { data: categories, isLoading } = categoryHooks.getCategories()
  const { colorScheme } = useColorScheme()

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
              <Button size="icon" variant="ghost">
                <Plus size={24} />
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
                <Text className="text-lg font-semibold">{category.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  Status: {category.isActive ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
