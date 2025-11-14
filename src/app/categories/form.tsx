import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Text } from '@/src/components/ui/text'

import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import { router, Stack } from 'expo-router'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, Switch, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Digite um nome para a categoria'),
  isActive: z.boolean(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

export default function CategoryFormScreen() {
  const { mutate: addCategory } = categoryHooks.addCategory()
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', isActive: true },
  })

  const onSubmit = (data: CategoryFormValues) => {
    addCategory({ name: data.name, isActive: data.isActive })
    router.back()
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: 'Nova Categoria' }} />
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          <View>
            <Text className="mb-2 font-medium">Nome da Categoria</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  className="rounded-md border border-input bg-background px-3 py-2 text-foreground"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex: Fertilizantes"
                />
              )}
            />
            {errors.name && (
              <Text className="text-red-500 mt-1">{errors.name.message}</Text>
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
            <Text className="ml-2">Categoria Ativa</Text>
          </View>

          <Button onPress={handleSubmit(onSubmit)} className="mt-4">
            <Text>Salvar Categoria</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
