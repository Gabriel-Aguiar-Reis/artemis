import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { CategoryForm } from '@/src/components/ui/forms/category-form'
import { Text } from '@/src/components/ui/text'
import {
  CategoryUpdateDTO,
  categoryUpdateSchema,
} from '@/src/domain/validations/category.schema'
import { UUID } from '@/src/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { Pencil, PencilOff } from 'lucide-react-native'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CategoriesEditScreen() {
  const params = useLocalSearchParams<{
    id: UUID
  }>()
  const queryClient = useQueryClient()

  const { data: category, isLoading } = categoryHooks.getCategory(params.id)
  const { mutate: updateCategory, isPending } = categoryHooks.updateCategory()

  const form = useForm<CategoryUpdateDTO>({
    resolver: zodResolver(categoryUpdateSchema),
    defaultValues: {
      name: '',
      isActive: true,
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  const onSubmit = form.handleSubmit((data: CategoryUpdateDTO) => {
    updateCategory({
      id: params.id,
      name: data.name ?? '',
      isActive: data.isActive ?? true,
    })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    router.back()
  })

  useEffect(() => {
    category && form.reset(category)
  }, [category])

  useEffect(() => {
    form.reset()
  }, [])

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando categoria...</Text>
      </SafeAreaView>
    )
  }

  if (!category) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Categoria não encontrada.</Text>
      </SafeAreaView>
    )
  }

  return (
    <CategoryForm
      title="Editar Categoria"
      onSubmit={onSubmit}
      errors={form.formState.errors}
      control={form.control}
      alternate={{ nameIcon: PencilOff, type: 'toDisabled' }}
      nameIcon={Pencil}
      submitLabel="Editar Categoria"
      loading={isPending}
    />
  )
}
