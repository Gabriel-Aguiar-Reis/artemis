import { productHooks } from '@/src/application/hooks/product.hooks'
import { CategoryCombobox } from '@/src/components/ui/combobox/category-combobox'
import { BaseForm } from '@/src/components/ui/forms/base-form'
import { ProductForm } from '@/src/components/ui/forms/product-form'
import { Masks } from '@/src/components/ui/masks'
import { Text } from '@/src/components/ui/text'
import {
  ProductUpdateDTO,
  productUpdateSchema,
} from '@/src/domain/validations/product.schema'
import { UUID, getErrorMessage } from '@/src/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { router, useLocalSearchParams } from 'expo-router'
import { Pencil, PencilOff } from 'lucide-react-native'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProductsEditScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()

  const { data: product, isLoading } = productHooks.getProduct(params.id)
  const { mutate: updateProduct, isPending } = productHooks.updateProduct()

  const form = useForm<ProductUpdateDTO>({
    resolver: zodResolver(productUpdateSchema),
    defaultValues: {
      name: '',
      categoryId: undefined,
      salePrice: undefined,
      isActive: true,
      expiration: undefined,
      id: params.id,
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  const onSubmit = form.handleSubmit((data: ProductUpdateDTO) => {
    updateProduct({ ...data, id: params.id })
    router.back()
  })

  useEffect(() => {
    if (!product) return

    const formValues: Partial<ProductUpdateDTO> = {
      id: product.id as unknown as string,
      name: product.name,
      categoryId: product.categoryId as unknown as string,
      salePrice: product.salePrice,
      isActive: product.isActive,
      expiration: product.expiration.toDTO(),
    }

    form.reset(formValues)
  }, [product])

  useEffect(() => {
    form.reset()
  }, [])

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando produto...</Text>
      </SafeAreaView>
    )
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Produto não encontrado.</Text>
      </SafeAreaView>
    )
  }

  return (
    <ProductForm
      title="Editar Produto"
      onSubmit={onSubmit}
      errors={form.formState.errors}
      control={form.control}
      submitLabel="Editar Produto"
      loading={isPending}
      fields={[]}
      customRenderer={() => (
        <View className="flex-1 gap-4">
          <BaseForm.Input
            control={form.control}
            name="name"
            label="Nome do Produto"
            placeholder="Ex. Guardanapo 70x70cm"
            icon={Pencil}
            alternate={{ icon: PencilOff, type: 'toDisabled' }}
            error={getErrorMessage(form.formState.errors?.name?.message)}
          />

          <CategoryCombobox
            selectedCategoryId={form.watch('categoryId') || ''}
            onCategoryChange={(categoryId) =>
              form.setValue('categoryId', categoryId)
            }
            label="Categoria"
            placeholder="Escolha a categoria..."
          />

          <BaseForm.Input.Currency
            control={form.control}
            name="salePrice"
            label="Preço de Venda"
            placeholder="Ex. 19,90"
            inputProps={{ keyboardType: 'numeric', mask: Masks.BRL_CURRENCY }}
            icon={Pencil}
            alternate={{ icon: PencilOff, type: 'toDisabled' }}
            error={getErrorMessage(form.formState.errors?.salePrice?.message)}
          />

          <BaseForm.Input
            control={form.control}
            name="expiration"
            label="Prazo de validade"
            placeholder="Ex: 30 dias"
            icon={Pencil}
            alternate={{ icon: PencilOff, type: 'toDisabled' }}
            isDialog={true}
            error={getErrorMessage(form.formState.errors?.expiration?.message)}
          />

          <BaseForm.Switch
            control={form.control}
            name="isActive"
            label="Produto Ativo"
          />

          <BaseForm.SubmitButton onPress={onSubmit} loading={isPending}>
            Editar Produto
          </BaseForm.SubmitButton>
        </View>
      )}
    />
  )
}
