import { customerHooks } from '@/src/application/hooks/customer.hooks'
import { GeocodingService } from '@/src/application/services/geocoding.service'
import { CustomerForm } from '@/src/components/ui/forms/customer-form'
import { Masks } from '@/src/components/ui/masks'
import { Text } from '@/src/components/ui/text'
import {
  CustomerUpdateDTO,
  customerUpdateSchema,
} from '@/src/domain/validations/customer.schema'
import { UUID } from '@/src/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { router, useLocalSearchParams } from 'expo-router'
import { Pencil, PencilOff, Search } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CustomersEditScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()

  const { data: customer, isLoading: isLoadingCustomer } =
    customerHooks.getCustomer(params.id)
  const { mutate: updateCustomer, isPending } = customerHooks.updateCustomer()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CustomerUpdateDTO>({
    resolver: zodResolver(customerUpdateSchema),
    defaultValues: {
      storeName: '',
      contactName: '',
      phoneNumber: undefined,
      phoneIsWhatsApp: false,
      landlineNumber: undefined,
      landlineIsWhatsApp: false,
      addressStreetName: '',
      addressStreetNumber: '',
      addressNeighborhood: '',
      addressCity: '',
      addressState: '',
      addressZipCode: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  const onSubmit = form.handleSubmit((data: CustomerUpdateDTO) => {
    updateCustomer({
      id: params.id,
      ...data,
    })
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

  useEffect(() => {
    if (!customer) return

    const formValues: Partial<CustomerUpdateDTO> = {
      storeName: customer.storeName,
      contactName: customer.contactName,
      phoneNumber: customer.phoneNumber?.value ?? undefined,
      phoneIsWhatsApp: customer.phoneNumber?.isWhatsApp ?? false,
      landlineNumber: customer.landlineNumber?.value ?? undefined,
      landlineIsWhatsApp: customer.landlineNumber?.isWhatsApp ?? false,
      addressStreetName: customer.storeAddress.streetName,
      addressStreetNumber: customer.storeAddress.streetNumber.toString(),
      addressNeighborhood: customer.storeAddress.neighborhood,
      addressCity: customer.storeAddress.city,
      addressState: customer.storeAddress.state,
      addressZipCode: customer.storeAddress.zipCode,
    }

    console.log('Setting form values:', formValues)
    form.reset(formValues)
  }, [customer])

  useEffect(() => {
    form.reset()
  }, [])

  if (isLoadingCustomer)
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando cliente...</Text>
      </SafeAreaView>
    )

  if (!customer)
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Cliente não encontrado.</Text>
      </SafeAreaView>
    )

  return (
    <CustomerForm
      title="Editar Cliente"
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
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
        },
        {
          name: 'contactName',
          label: 'Nome do Contato',
          placeholder: 'Ex. João Silva',
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
        },
        {
          name: 'addressZipCode',
          label: 'CEP',
          placeholder: 'Ex. 12345-678',
          icon: Search,
          isSearch: true,
          isSearchLoading: isLoading,
          inputProps: { mask: Masks.ZIP_CODE },
          onSearchPress: () => {
            const zipCode = form.getValues('addressZipCode')
            if (typeof zipCode === 'string' && zipCode.trim() !== '') {
              handleSearchAddress(zipCode)
            }
          },
        },
        {
          name: 'addressStreetName',
          label: 'Rua',
          placeholder: 'Ex. Rua das Flores',
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
        },
        {
          name: 'addressStreetNumber',
          label: 'Número',
          placeholder: 'Ex. 123',
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
          inputProps: { keyboardType: 'numeric' },
        },
        {
          name: 'addressNeighborhood',
          label: 'Bairro',
          placeholder: 'Ex. Centro',
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
        },
        {
          name: 'addressCity',
          label: 'Cidade',
          placeholder: 'Ex. São Paulo',
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
        },
        {
          name: 'addressState',
          label: 'Estado',
          placeholder: 'Ex. SP',
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
        },
        {
          name: 'phoneNumber',
          label: 'Telefone',
          placeholder: 'Ex. 11 912345678',
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
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
          placeholder: 'Ex. 11 34567890',
          icon: Pencil,
          alternate: { icon: PencilOff, type: 'toDisabled' },
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
