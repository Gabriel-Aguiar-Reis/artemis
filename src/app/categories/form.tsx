import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { CategoryForm } from '@/src/components/ui/forms/category-form'
import {
  CategoryInsertDTO,
  categoryInsertSchema,
} from '@/src/domain/validations/category.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { CircleQuestionMark } from 'lucide-react-native'
import { useForm } from 'react-hook-form'

export default function CategoryFormScreen() {
  const { mutate: addCategory, isPending } = categoryHooks.addCategory()
  const form = useForm<CategoryInsertDTO>({
    resolver: zodResolver(categoryInsertSchema),
    defaultValues: { name: '', isActive: true },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  const onSubmit = form.handleSubmit((data: CategoryInsertDTO) => {
    addCategory(data)
    router.back()
  })

  return (
    <CategoryForm
      title="Nova Categoria"
      onSubmit={onSubmit}
      errors={form.formState.errors}
      control={form.control}
      nameIcon={CircleQuestionMark}
      nameIconTooltip="Escolha um nome que represente bem os itens que serão agrupados nesta categoria."
      submitLabel="Salvar Categoria"
      loading={isPending}
    />
  )
}
