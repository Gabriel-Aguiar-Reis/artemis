import { productHooks } from '@/src/application/hooks/product.hooks'
import { ProductForm } from '@/src/components/ui/forms/product-form'
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
  const form = useForm<ProductInsertDTO>({
    resolver: zodResolver(productInsertSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      salePrice: 0,
      isActive: true,
      expiration: '30 days',
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
          label: 'ID da Categoria',
          placeholder: 'Ex. 123e4567-e89b-12d3-a456-426614174000',
          icon: CircleQuestionMark,
          iconTooltip:
            'ID da categoria à qual este produto pertence. Verifique o ID na tela de categorias.',
        },
        {
          name: 'salePrice',
          label: 'Preço de Venda',
          placeholder: 'Ex. 19,90',
          inputProps: { keyboardType: 'numeric' },
          isCurrency: true,
          icon: CircleQuestionMark,
          iconTooltip:
            'Preço pelo qual o produto será vendido aos clientes. Não é necessário inserir o símbolo de moeda ou separadores de milhar.',
        },
        {
          name: 'expiration',
          label: 'Validade',
          placeholder: 'Ex: 30 days',
          icon: CircleQuestionMark,
          iconTooltip:
            'Período após o qual o produto expira. Utilize o formato "X days", "X months", etc.',
        },
      ]}
    />
  )
}
