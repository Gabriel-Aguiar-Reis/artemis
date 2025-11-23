import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { productHooks } from '@/src/application/hooks/product.hooks'
import { ProductForm } from '@/src/components/ui/forms/product-form'
import { Text } from '@/src/components/ui/text'
import {
  ProductUpdateDTO,
  productUpdateSchema,
} from '@/src/domain/validations/product.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { UUID } from 'crypto'
import { router, useLocalSearchParams } from 'expo-router'
import { Pencil, PencilOff } from 'lucide-react-native'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProductsEditScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()

  const { data: product, isLoading } = productHooks.getProduct(params.id)
  const { mutate: updateProduct, isPending } = productHooks.updateProduct()
  const { data: categories } = categoryHooks.getActiveCategories()

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
      expiration: product.expiration.value,
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
      fields={[
        {
          name: 'name',
          label: 'Nome do Produto',
          placeholder: 'Ex. Guardanapo 70x70cm',
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
        },
        {
          name: 'categoryId',
          label: 'Nome da Categoria',
          placeholder: 'Escolha a categoria...',
          isSelect: true,
          inputProps: {
            selectOptions:
              categories?.map((c) => ({ id: c.id, nome: c.name })) ?? [],
          },
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
        },
        {
          name: 'salePrice',
          label: 'Preço de Venda',
          placeholder: 'Ex. 19,90',
          inputProps: { keyboardType: 'numeric' },
          isCurrency: true,
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
        },
        {
          name: 'expiration',
          label: 'Prazo de validade',
          placeholder: 'Ex: 30 dias',
          isDialog: true,
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
        },
      ]}
    />
  )
}
