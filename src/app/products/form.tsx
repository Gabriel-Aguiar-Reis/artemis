import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { productHooks } from '@/src/application/hooks/product.hooks'
import { ProductForm } from '@/src/components/ui/forms/product-form'
import { Masks } from '@/src/components/ui/masks'
import {
  ProductInsertDTO,
  productInsertSchema,
} from '@/src/domain/validations/product.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { CircleQuestionMark } from 'lucide-react-native'
import * as React from 'react'
import { useForm } from 'react-hook-form'

export default function ProductFormScreen() {
  const { mutate: addProduct, isPending } = productHooks.addProduct()
  const { data: categories } = categoryHooks.getActiveCategories()

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
      fields={[
        {
          name: 'name',
          label: 'Nome do Produto',
          placeholder: 'Ex. Guardanapo 70x70cm',
          icon: CircleQuestionMark,
          iconTooltip: 'Nome pelo qual o produto será identificado',
        },
        {
          name: 'categoryId',
          label: 'Nome da Categoria',
          placeholder: 'Escolha a categoria...',
          icon: CircleQuestionMark,
          iconTooltip: 'Escolha a categoria ao qual o produto pertence.',
          isSelect: true,
          inputProps: {
            selectOptions:
              categories?.map((c) => ({ id: c.id, nome: c.name })) ?? [],
          },
        },
        {
          name: 'salePrice',
          label: 'Preço de Venda',
          placeholder: 'Ex. 19,90',
          inputProps: { keyboardType: 'numeric', mask: Masks.BRL_CURRENCY },
          isCurrency: true,
          icon: CircleQuestionMark,
          iconTooltip:
            'Preço pelo qual o produto será vendido aos clientes. Não é necessário inserir o símbolo de moeda ou separadores de milhar.',
        },
        {
          name: 'expiration',
          label: 'Prazo de validade',
          placeholder: 'Ex: 30 dias',
          icon: CircleQuestionMark,
          iconTooltip:
            'Período após o qual o produto expira. Utilize o formato "X dias", "X meses", etc.',
          isDialog: true,
        },
      ]}
    />
  )
}
