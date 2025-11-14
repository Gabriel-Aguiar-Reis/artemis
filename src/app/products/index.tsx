import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { productHooks } from '@/src/application/hooks/product.hooks'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { Link, Stack } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProductsScreen() {
  const { data: products, isLoading: loadingProducts } =
    productHooks.getProducts()
  const { data: categories } = categoryHooks.getCategories()
  const { colorScheme } = useColorScheme()

  if (loadingProducts) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando produtos...</Text>
      </SafeAreaView>
    )
  }

  if (!products || products.length === 0) {
    return (
      <SafeAreaView className="flex-1">
        <Stack.Screen
          options={{
            title: 'Produtos',
            headerRight: () => (
              <Link href="/products/form" asChild>
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
            Nenhum produto cadastrado.{'\n'}
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
          title: 'Produtos',
          headerRight: () => (
            <Link href="/products/form" asChild>
              <Button size="icon" variant="ghost">
                <Plus size={24} />
              </Button>
            </Link>
          ),
        }}
      />
      <ScrollView className="flex-1">
        <View className="gap-3 p-4">
          {products.map((product) => {
            const category = categories?.find(
              (c) => c.id === product.categoryId
            )
            return (
              <View
                key={product.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <Text className="text-lg font-semibold">{product.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  Categoria: {category?.name || 'N/A'}
                </Text>
                <Text className="text-sm">
                  Preço: R$ {product.salePrice.toFixed(2)}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Validade: {product.expiration.value}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Status: {product.isActive ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
