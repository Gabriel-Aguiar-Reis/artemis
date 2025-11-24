import { customerHooks } from '@/src/application/hooks/customer.hooks'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import { BackToTopButton } from '@/src/components/ui/back-to-top-button'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ConfirmDeleteDialog } from '@/src/components/ui/dialog/confirm-delete-dialog'
import { Icon } from '@/src/components/ui/icon'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Text } from '@/src/components/ui/text'
import { WhatsAppIcon } from '@/src/components/ui/whatsapp-icon'
import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { formatPhoneBrazil, smartSearch } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { UUID } from 'crypto'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import {
  EditIcon,
  House,
  Phone,
  TrashIcon,
  UtilityPole,
} from 'lucide-react-native'
import * as React from 'react'
import { useMemo, useRef, useState } from 'react'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CustomersScreen() {
  const { data: customers, isLoading } = customerHooks.getCustomers()
  const { mutate: deleteCustomer } = customerHooks.deleteCustomer()

  const params = useLocalSearchParams<{
    search?: string
    contactName?: string
    phoneNumber?: string
    landlineNumber?: string
    isActiveWhatsApp?: string
  }>()

  const filteredCustomers = useMemo(() => {
    if (!customers) return []

    return customers.filter((customer) => {
      const matchesSearch = params.search
        ? smartSearch(customer.storeName, params.search)
        : true

      const matchesContactName = params.contactName
        ? smartSearch(customer.contactName, params.contactName)
        : true

      const matchesPhoneNumber = params.phoneNumber
        ? smartSearch(customer.phoneNumber.value, params.phoneNumber)
        : true

      const matchesLandlineNumber = params.landlineNumber
        ? customer.landlineNumber
          ? smartSearch(customer.landlineNumber.value, params.landlineNumber)
          : false
        : true

      const matchesIsActiveWhatsApp = params.isActiveWhatsApp
        ? customer.isActiveWhatsApp().toString() === params.isActiveWhatsApp
        : true

      return (
        matchesContactName &&
        matchesPhoneNumber &&
        matchesLandlineNumber &&
        matchesIsActiveWhatsApp &&
        matchesSearch
      )
    })
  }, [
    customers,
    params.search,
    params.contactName,
    params.phoneNumber,
    params.landlineNumber,
    params.isActiveWhatsApp,
  ])

  const hasActiveFilters =
    !!params.search ||
    !!params.contactName ||
    !!params.phoneNumber ||
    !!params.landlineNumber ||
    !!params.isActiveWhatsApp

  const activeFilters = useMemo(() => {
    const filters = []
    if (params.search) {
      filters.push({ label: 'Pesquisa', value: params.search })
    }

    if (params.contactName) {
      filters.push({ label: 'Nome do Contato', value: params.contactName })
    }

    if (params.phoneNumber) {
      filters.push({ label: 'Telefone', value: params.phoneNumber })
    }

    if (params.landlineNumber) {
      filters.push({ label: 'Telefone Fixo', value: params.landlineNumber })
    }

    if (params.isActiveWhatsApp) {
      filters.push({
        label: 'WhatsApp Ativo',
        value: params.isActiveWhatsApp === 'true' ? 'Sim' : 'Não',
      })
    }
    return filters
  }, [
    params.search,
    params.contactName,
    params.phoneNumber,
    params.landlineNumber,
    params.isActiveWhatsApp,
  ])

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: UUID
    name: string
  } | null>(null)

  const handleCustomerOptions = async (
    customerId: UUID,
    customerName: string
  ) => {
    await SheetManager.show('customer-options-sheet', {
      payload: {
        title: customerName,
        options: [
          {
            label: 'Editar',
            icon: EditIcon,
            onPress: () => {
              router.push(`/customers/${customerId}/edit`)
            },
          },
          {
            label: 'Excluir',
            icon: TrashIcon,
            destructive: true,
            onPress: () => {
              setSelectedCustomer({ id: customerId, name: customerName })
              setDeleteDialogOpen(true)
            },
          },
        ],
      },
    })
  }

  const handleDeleteCustomer = (customerId: UUID) => {
    deleteCustomer(customerId)
    setDeleteDialogOpen(false)
  }

  const renderItem = (customer: Customer) => {
    return (
      <ObjectCard.Root key={customer.id} className="mb-4">
        <ObjectCard.Header>
          <ObjectCard.Title>{customer.storeName}</ObjectCard.Title>
          <ObjectCard.Description>
            <View className="flex-row gap-2 items-center text-ring">
              <Icon as={House} size={20} />
              <Text>
                <Text>
                  {customer.storeAddress.streetName}, Nº{' '}
                  {customer.storeAddress.streetNumber},{' '}
                  {customer.storeAddress.city} - {customer.storeAddress.state},{' '}
                  {customer.storeAddress.zipCode}
                </Text>
              </Text>
            </View>
          </ObjectCard.Description>
          <ObjectCard.Actions
            onPress={() =>
              handleCustomerOptions(customer.id, customer.storeName)
            }
          />
        </ObjectCard.Header>
        <ObjectCard.Content>
          <View className="flex-row items-center gap-2 text-primary">
            <Icon as={Phone} size={20} />
            <Text>
              {customer.contactName} -{' '}
              {formatPhoneBrazil(customer.phoneNumber.value)}
            </Text>
            {customer.phoneNumber.isWhatsApp && (
              <Icon as={WhatsAppIcon} size={20} className="text-green-600" />
            )}
          </View>
          {customer.landlineNumber && (
            <View className="flex-row items-center gap-2 text-primary">
              <Icon as={UtilityPole} size={20} />
              <Text>{customer.landlineNumber.value}</Text>
              {customer.landlineNumber.isWhatsApp && (
                <Icon as={WhatsAppIcon} size={20} className="text-green-600" />
              )}
            </View>
          )}
        </ObjectCard.Content>
      </ObjectCard.Root>
    )
  }

  // Adicionado useRef e useState para ScrollView e botão de voltar ao topo
  const scrollRef = useRef<ScrollView>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y
    setShowScrollBtn(offsetY > 0)
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando clientes...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Clientes',
          headerRight: () => (
            <View className="flex-row gap-2">
              <ButtonFilter
                href={{
                  pathname: '/customers/search',
                  params: {
                    ...params,
                  },
                }}
                isActive={hasActiveFilters}
              />
              <ButtonNew href="/customers/form" />
            </View>
          ),
        }}
      />
      {!customers || customers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhum cliente cadastrado.{' \n'}
            Clique no + para adicionar.
          </Text>
        </View>
      ) : (
        <>
          <ActiveFiltersBanner
            filters={activeFilters}
            clearFiltersHref="/customers"
          />
          <ScrollView
            className="flex-1"
            ref={scrollRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View className="gap-3 p-4">
              {filteredCustomers.length === 0 ? (
                <View className="items-center py-12">
                  <Text className="text-center text-muted-foreground">
                    Nenhum cliente encontrado com os filtros aplicados.
                  </Text>
                </View>
              ) : (
                <FlashList
                  data={filteredCustomers}
                  renderItem={({ item }) => renderItem(item)}
                  ListFooterComponent={<View className="h-16" />}
                />
              )}
            </View>
          </ScrollView>

          {/* Botão de voltar ao topo */}
          <BackToTopButton isVisible={showScrollBtn} scrollRef={scrollRef} />
          {selectedCustomer && (
            <ConfirmDeleteDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              title={`Excluir cliente "${selectedCustomer.name}"?`}
              handleDelete={() => {
                handleDeleteCustomer(selectedCustomer.id)
              }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  )
}
