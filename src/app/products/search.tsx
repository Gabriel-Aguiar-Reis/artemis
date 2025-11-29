import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { Button } from '@/src/components/ui/button'
import { FloatingLabelInput } from '@/src/components/ui/floating-label-input'
import { Icon } from '@/src/components/ui/icon'
import { Input } from '@/src/components/ui/input'
import { Masks } from '@/src/components/ui/masks'
import { Text } from '@/src/components/ui/text'
import { PERIODS } from '@/src/lib/utils'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Search, X } from 'lucide-react-native'
import * as React from 'react'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProductsSearchScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    search?: string
    salePriceMin?: string
    salePriceMax?: string
    status?: 'all' | 'active' | 'inactive'
    categoryName?: string
    expiration?: string
  }>()

  const [searchQuery, setSearchQuery] = useState(params.search || '')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >(params.status || 'all')
  const [categoryNameFilter, setCategoryNameFilter] = useState(
    params.categoryName || ''
  )
  const { data: categories } = categoryHooks.getActiveCategories()
  const [expirationFilter, setExpirationFilter] = useState(
    params.expiration || ''
  )

  let selectedPeriod = 'dias'
  let selectedNumber = 1
  if (typeof expirationFilter === 'string') {
    const match = expirationFilter.match(/(\d+)\s*(dias|semanas|meses|anos)/)
    if (match) {
      selectedNumber = Number(match[1])
      selectedPeriod = match[2]
    }
  }
  const [minSalePriceFilter, setMinSalePriceFilter] = useState(
    params.salePriceMin || ''
  )
  const [maxSalePriceFilter, setMaxSalePriceFilter] = useState(
    params.salePriceMax || ''
  )

  const applyFilters = () => {
    router.back()

    const normalizeNumberParam = (val: string) => {
      if (!val) return undefined
      const cleaned = String(val)
        // remove currency symbol and spaces
        .replace(/R\$\s?/, '')
        .replace(/\s/g, '')
        // remove thousands separators like '.'
        .replace(/\.(?=\d{3}(?:\.|,|$))/g, '')
        .replace(/,/g, '.')
      const num = Number(cleaned)
      return isNaN(num) ? undefined : String(num)
    }

    setTimeout(() => {
      router.setParams({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        categoryName: categoryNameFilter || undefined,
        expiration: expirationFilter || undefined,
        salePriceMin: normalizeNumberParam(minSalePriceFilter),
        salePriceMax: normalizeNumberParam(maxSalePriceFilter),
      })
    }, 200)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setCategoryNameFilter('')
    setExpirationFilter('')
    setMinSalePriceFilter('')
    setMaxSalePriceFilter('')
  }

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    categoryNameFilter !== '' ||
    expirationFilter !== '' ||
    minSalePriceFilter !== '' ||
    maxSalePriceFilter !== ''

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: 'Filtrar Produtos' }} />

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

            <FloatingLabelInput
              label="Categoria"
              placeholder="Escolha a categoria..."
              value={categoryNameFilter}
              isSelect={true}
              selectOptions={
                categories?.map((c) => ({ id: c.name, nome: c.name })) ?? []
              }
              onSelectChange={(v) => setCategoryNameFilter(String(v))}
              gap={2}
            />

            <FloatingLabelInput
              label="Prazo de validade"
              placeholder="Ex: 30 dias"
              value={expirationFilter}
              isDialog={true}
              period={selectedPeriod}
              number={selectedNumber}
              PERIODS={PERIODS}
              onWheelChange={(v) => setExpirationFilter(v)}
              gap={2}
            />

            <View className="gap-2">
              <Text className="text-sm font-medium">Preço de Venda (R$)</Text>
              <View className="flex-row gap-2">
                <FloatingLabelInput
                  label="Mínimo"
                  mask={Masks.BRL_CURRENCY}
                  placeholder="29,90"
                  value={minSalePriceFilter}
                  onChangeText={setMinSalePriceFilter}
                  keyboardType="numeric"
                  className="flex-1"
                  inputMode="numeric"
                />
                <FloatingLabelInput
                  label="Máximo"
                  mask={Masks.BRL_CURRENCY}
                  placeholder="99,90"
                  value={maxSalePriceFilter}
                  onChangeText={setMaxSalePriceFilter}
                  keyboardType="numeric"
                  className="flex-1"
                  inputMode="numeric"
                />
              </View>
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
              <Button variant="ghost" size="sm" onPress={clearAllFilters}>
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
