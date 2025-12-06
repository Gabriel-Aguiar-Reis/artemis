import { customerHooks } from '@/src/application/hooks/customer.hooks'
import { GeocodingService } from '@/src/application/services/geocoding.service'
import { CustomerForm } from '@/src/components/ui/forms/customer-form'
import { Masks } from '@/src/components/ui/masks'
import {
  CustomerInsertDTO,
  customerInsertSchema,
} from '@/src/domain/validations/customer.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { CircleQuestionMark, Search } from 'lucide-react-native'
import * as React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export default function CustomerFormScreen() {
  const { mutate: addCustomer, isPending } = customerHooks.addCustomer()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CustomerInsertDTO>({
    resolver: zodResolver(customerInsertSchema),
    defaultValues: {
      storeName: '',
      contactName: '',
      phoneNumber: undefined,
      phoneIsWhatsApp: false,
      landlineNumber: undefined,
      landlineIsWhatsApp: false,
      addressStreetName: '',
      addressStreetNumber: '0',
      addressNeighborhood: '',
      addressCity: '',
      addressState: '',
      addressZipCode: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  const onSubmit = form.handleSubmit((data: CustomerInsertDTO) => {
    console.log('Submitting customer:', data)
    addCustomer(data)
    router.back()
  })

  const handleSearchAddress = async (zipCode: string) => {
    setIsLoading(true)
    try {
      const address = await GeocodingService.getAddressByZipCode(zipCode)
      if (address) {
        form.setValue('addressStreetName', address.streetName)
        form.setValue('addressStreetNumber', address.streetNumber.toString())
        form.setValue('addressNeighborhood', address.neighborhood)
        form.setValue('addressCity', address.city)
        form.setValue('addressState', address.state)
      }
      console.log(address)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CustomerForm
      title="Novo Cliente"
      onSubmit={onSubmit}
      errors={form.formState.errors}
      control={form.control}
      trigger={form.trigger}
      submitLabel="Salvar Cliente"
      loading={isPending}
      fields={[
        {
          name: 'storeName',
          label: 'Nome da Estabelecimento',
          placeholder: 'Ex. Loja do João',
          icon: CircleQuestionMark,
          iconTooltip: 'Nome pelo qual o estabelecimento será identificado.',
        },
        {
          name: 'contactName',
          label: 'Nome do Contato',
          placeholder: 'Ex. João Silva',
          icon: CircleQuestionMark,
          iconTooltip: 'Nome do contato principal do estabelecimento.',
        },
        {
          name: 'addressZipCode',
          label: 'CEP',
          placeholder: 'Ex. 12345-678',
          icon: Search,
          isSearch: true,
          isSearchLoading: isLoading,
          helperText:
            'Clique no botão de pesquisa para preencher automaticamente',
          inputProps: { mask: Masks.ZIP_CODE },
          onSearchPress: () => {
            const zipCode = form.getValues('addressZipCode')
            handleSearchAddress(zipCode)
          },
        },
        {
          name: 'addressStreetName',
          label: 'Rua',
          placeholder: 'Ex. Rua das Flores',
          icon: CircleQuestionMark,
          iconTooltip: 'Nome da rua do endereço do estabelecimento.',
        },
        {
          name: 'addressStreetNumber',
          label: 'Número',
          placeholder: 'Ex. 123',
          icon: CircleQuestionMark,
          iconTooltip: 'Número do endereço do estabelecimento.',
          inputProps: { keyboardType: 'numeric' },
        },
        {
          name: 'addressNeighborhood',
          label: 'Bairro',
          placeholder: 'Ex. Centro',
          icon: CircleQuestionMark,
          iconTooltip: 'Nome do bairro do endereço do estabelecimento.',
        },
        {
          name: 'addressCity',
          label: 'Cidade',
          placeholder: 'Ex. São Paulo',
          icon: CircleQuestionMark,
          iconTooltip: 'Nome da cidade do endereço do estabelecimento.',
        },
        {
          name: 'addressState',
          label: 'Estado',
          placeholder: 'Ex. SP',
          icon: CircleQuestionMark,
          iconTooltip: 'Nome do estado do endereço do estabelecimento.',
        },
        {
          name: 'phoneNumber',
          label: 'Telefone',
          placeholder: 'Ex. (11) 91234-5678',
          icon: CircleQuestionMark,
          iconTooltip: 'Número de telefone no formato (XX) XXXXX-XXXX.',
          inputProps: { mask: Masks.BRL_PHONE },
        },
        {
          name: 'phoneIsWhatsApp',
          label: 'WhatsApp',
          isCheckbox: true,
        },
        {
          name: 'landlineNumber',
          label: 'Telefone Fixo (Opcional)',
          placeholder: 'Ex. (11) 3456-7890',
          icon: CircleQuestionMark,
          iconTooltip: 'Número de telefone fixo no formato (XX) XXXX-XXXX.',
          inputProps: { mask: Masks.BRL_LANDLINE_PHONE },
        },
        {
          name: 'landlineIsWhatsApp',
          label: 'WhatsApp',
          isCheckbox: true,
        },
      ]}
      steps={[
        {
          label: 'Informações do Estabelecimento',
          fields: ['storeName', 'contactName'],
        },
        {
          label: 'Dados do Endereço',
          fields: [
            'addressZipCode',
            'addressStreetName',
            'addressStreetNumber',
            'addressNeighborhood',
            'addressCity',
            'addressState',
          ],
        },
        {
          label: 'Dados do Contato',
          fields: [
            'phoneNumber',
            'phoneIsWhatsApp',
            'landlineNumber',
            'landlineIsWhatsApp',
          ],
        },
      ]}
    />
  )
}
