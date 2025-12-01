import { productHooks } from '@/src/application/hooks/product.hooks'
import { CategoryCombobox } from '@/src/components/ui/combobox/category-combobox'
import { BaseForm } from '@/src/components/ui/forms/base-form'
import { ProductForm } from '@/src/components/ui/forms/product-form'
import { Masks } from '@/src/components/ui/masks'
import {
  ProductInsertDTO,
  productInsertSchema,
} from '@/src/domain/validations/product.schema'
import { getErrorMessage } from '@/src/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { CircleQuestionMark } from 'lucide-react-native'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'

export default function ProductFormScreen() {
  const { mutate: addProduct, isPending } = productHooks.addProduct()

  const form = useForm<ProductInsertDTO>({
    resolver: zodResolver(productInsertSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      salePrice: undefined,
      isActive: true,
      expiration: '30 dias',
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  const onSubmit = form.handleSubmit((data: ProductInsertDTO) => {
    addProduct(data)
    router.back()
  })

  return (
    <ProductForm
      title="Novo Produto"
      onSubmit={onSubmit}
      errors={form.formState.errors}
      control={form.control}
      submitLabel="Salvar Produto"
      loading={isPending}
      fields={[]}
      customRenderer={() => (
        <View className="flex-1 gap-4">
          <BaseForm.Input
            control={form.control}
            name="name"
            label="Nome do Produto"
            placeholder="Ex. Guardanapo 70x70cm"
            icon={CircleQuestionMark}
            iconTooltip="Nome pelo qual o produto será identificado"
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
            icon={CircleQuestionMark}
            iconTooltip="Preço pelo qual o produto será vendido aos clientes. Não é necessário inserir o símbolo de moeda ou separadores de milhar."
            error={getErrorMessage(form.formState.errors?.salePrice?.message)}
          />

          <BaseForm.Input
            control={form.control}
            name="expiration"
            label="Prazo de validade"
            placeholder="Ex: 30 dias"
            icon={CircleQuestionMark}
            iconTooltip="Período após o qual o produto expira. Utilize o formato 'X dias', 'X meses', etc."
            isDialog={true}
            error={getErrorMessage(form.formState.errors?.expiration?.message)}
          />

          <BaseForm.Switch
            control={form.control}
            name="isActive"
            label="Produto Ativo"
          />

          <BaseForm.SubmitButton onPress={onSubmit} loading={isPending}>
            Salvar Produto
          </BaseForm.SubmitButton>
        </View>
      )}
    />
  )
}
