import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Input } from '@/src/components/ui/input'
import { Text } from '@/src/components/ui/text'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Search, X } from 'lucide-react-native'
import * as React from 'react'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CategoriesSearchScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    search?: string
    status?: 'all' | 'active' | 'inactive'
  }>()

  const [searchQuery, setSearchQuery] = useState(params.search || '')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >(params.status || 'all')

  const applyFilters = () => {
    router.back()

    setTimeout(() => {
      router.setParams({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
    }, 200)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
  }

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all'

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: 'Filtrar Categorias' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={80}
      >
        <View style={{ flex: 1 }}>
          <View className="gap-4 p-4 flex-1">
            <View className="relative">
              <Icon
                as={Search}
                className="text-muted-foreground absolute left-3 top-2.5 z-10"
                size={20}
              />
              <Input
                placeholder="Pesquisar por nome..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="pl-10 pr-10"
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

            <View className="gap-2">
              <Text className="text-sm font-medium">Status</Text>
              <View className="flex-row gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setStatusFilter('all')}
                  className="flex-1"
                >
                  <Text
                    className={
                      statusFilter === 'all'
                        ? 'text-primary-foreground'
                        : 'text-foreground'
                    }
                  >
                    Todos
                  </Text>
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setStatusFilter('active')}
                  className="flex-1"
                >
                  <Text
                    className={
                      statusFilter === 'active'
                        ? 'text-primary-foreground'
                        : 'text-foreground'
                    }
                  >
                    Ativos
                  </Text>
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setStatusFilter('inactive')}
                  className="flex-1"
                >
                  <Text
                    className={
                      statusFilter === 'inactive'
                        ? 'text-primary-foreground'
                        : 'text-foreground'
                    }
                  >
                    Inativos
                  </Text>
                </Button>
              </View>
            </View>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onPress={clearFilters}>
                <Icon as={X} size={16} className="text-foreground mr-2" />
                <Text>Limpar filtros</Text>
              </Button>
            )}
          </View>
        </View>
        <View className="gap-2 px-4 pb-4 bg-background">
          <Button onPress={applyFilters}>
            <Text className="text-primary-foreground font-medium">
              Aplicar Filtros
            </Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
