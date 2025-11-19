import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { CategoryForm } from '@/src/components/ui/forms/category-form'
import { Text } from '@/src/components/ui/text'
import {
  CategoryUpdateDTO,
  categoryUpdateSchema,
} from '@/src/domain/validations/category.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { UUID } from 'crypto'
import { router, useLocalSearchParams } from 'expo-router'
import { Pencil } from 'lucide-react-native'
import { useForm } from 'react-hook-form'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function EditCategoryScreen() {
  const params = useLocalSearchParams<{
    id: UUID
  }>()

  const { data: category, isLoading } = categoryHooks.getCategory(params.id)
  const { mutate: updateCategory } = categoryHooks.updateCategory()

  const form = useForm<CategoryUpdateDTO>({
    resolver: zodResolver(categoryUpdateSchema),
    defaultValues: {
      name: category?.name ?? '',
      isActive: category?.isActive ?? true,
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
    router.back()
  })

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
      nameIcon={Pencil}
      nameIconTooltip={undefined}
      submitLabel="Editar Categoria"
    />
  )
}
