import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { productHooks } from '@/src/application/hooks/product.hooks'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Text } from '@/src/components/ui/text'
import { zodResolver } from '@hookform/resolvers/zod'
import { Stack } from 'expo-router'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Platform, ScrollView, Switch, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(1, 'Digite o nome do produto'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  salePrice: z.string().min(1, 'Digite o preço'),
  expiration: z.string().min(1, 'Digite a validade'),
  isActive: z.boolean(),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function ProductFormScreen() {
  const { mutate: addProduct } = productHooks.addProduct()
  const { data: categories } = categoryHooks.getActiveCategories()

  const insets = useSafeAreaInsets()
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({
      ios: insets.bottom,
      android: insets.bottom + 24,
    }),
    left: 12,
    right: 12,
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      salePrice: '',
      expiration: '1 year',
      isActive: true,
    },
  })

  const onSubmit = (data: ProductFormValues) => {
    addProduct(
      {
        name: data.name,
        categoryId: data.categoryId,
        salePrice: parseFloat(data.salePrice),
        expiration: data.expiration,
        isActive: data.isActive,
      },
      {
        onSuccess: () => {
          console.log('✅ Produto criado com sucesso!')
          // router.back()
        },
        onError: (err) => {
          console.error('❌ Erro ao criar produto:', err)
        },
      }
    )
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: 'Novo Produto' }} />
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          <View>
            <Text className="mb-2 font-medium">Nome do Produto</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex: Adubo NPK 10-10-10"
                />
              )}
            />
            {errors.name && (
              <Text className="mt-1 text-red-500">{errors.name.message}</Text>
            )}
          </View>

          <View>
            <Text className="mb-2 font-medium">Categoria</Text>
            <Controller
              control={control}
              name="categoryId"
              render={({ field: { onChange } }) => (
                <View className="rounded-md border border-input bg-background">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent
                      align="center"
                      insets={contentInsets}
                      className="w-full"
                    >
                      {[1, 2, 3, 4]?.map((category) => (
                        <SelectItem
                          key={category}
                          label={'teste'}
                          value={category.toString()}
                          onPress={() => onChange(category.toString())}
                        />
                      ))}
                    </SelectContent>
                  </Select>
                </View>
              )}
            />
            {errors.categoryId && (
              <Text className="mt-1 text-red-500">
                {errors.categoryId.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="mb-2 font-medium">Preço de Venda</Text>
            <Controller
              control={control}
              name="salePrice"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              )}
            />
            {errors.salePrice && (
              <Text className="mt-1 text-red-500">
                {errors.salePrice.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="mb-2 font-medium">Validade</Text>
            <Controller
              control={control}
              name="expiration"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex: 1 year, 6 months, 30 days"
                />
              )}
            />
            {errors.expiration && (
              <Text className="mt-1 text-red-500">
                {errors.expiration.message}
              </Text>
            )}
          </View>

          <View className="flex-row items-center">
            <Controller
              control={control}
              name="isActive"
              render={({ field: { onChange, value } }) => (
                <Switch value={value} onValueChange={onChange} />
              )}
            />
            <Text className="ml-2">Produto Ativo</Text>
          </View>

          <Button onPress={handleSubmit(onSubmit)} className="mt-4">
            <Text>Salvar Produto</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
