import { customerHooks } from '@/src/application/hooks/customer.hooks'
import { useCustomersInfinite } from '@/src/application/hooks/use-customers-infinite'
import { ActiveFiltersBanner } from '@/src/components/ui/active-filters-banner'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonNew } from '@/src/components/ui/button-new'
import { ConfirmDeleteDialog } from '@/src/components/ui/dialog/confirm-delete-dialog'
import { Icon } from '@/src/components/ui/icon'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Text } from '@/src/components/ui/text'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/src/components/ui/tooltip'
import { WhatsAppIcon } from '@/src/components/ui/whatsapp-icon'
import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { formatPhoneBrazil, UUID } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import {
  EditIcon,
  MapPinHouse,
  Phone,
  Store,
  TrashIcon,
  UserSquare2,
  UtilityPole,
} from 'lucide-react-native'
import * as React from 'react'
import { useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CustomersScreen() {
  const params = useLocalSearchParams<{
    search?: string
    contactName?: string
    phoneNumber?: string
    landlineNumber?: string
    isActiveWhatsApp?: string
  }>()

  const filters = {
    search: params.search,
    contactName: params.contactName,
    phoneNumber: params.phoneNumber,
    landlineNumber: params.landlineNumber,
    isActiveWhatsApp: params.isActiveWhatsApp,
  }

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useCustomersInfinite(filters)
  const { mutate: deleteCustomer } = customerHooks.deleteCustomer()

  // Combina todas as páginas de clientes em um único array
  const allCustomers = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.data)
  }, [data])

  // Os dados já vêm filtrados do servidor via repository
  const displayedCustomers = allCustomers

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
    await SheetManager.show('options-sheet', {
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
    const address = `${customer.storeAddress.streetName}, ${customer.storeAddress.streetNumber}, ${customer.storeAddress.zipCode}, ${customer.storeAddress.city} - ${customer.storeAddress.state}`
    return (
      <ObjectCard.Root key={customer.id} className="mb-4 dark:bg-input/30">
        <ObjectCard.Header>
          <ObjectCard.Title>
            <View className="flex-row gap-2 items-center">
              <Icon as={Store} size={20} className="text-primary" />
              <Text className="font-bold">{customer.storeName}</Text>
            </View>
          </ObjectCard.Title>
          <ObjectCard.Description>
            <View className="flex-row gap-2 items-center">
              <Icon as={MapPinHouse} size={20} className="text-ring" />
              <Text className="text-sm text-ring text-wrap mr-4">
                {address}
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
          <View className="flex-row gap-2 items-center">
            <Icon as={UserSquare2} size={16} />
            <Text className="font-bold">{customer.contactName}</Text>
            {customer.isActiveWhatsApp() && (
              <WhatsAppIcon size={16} className="text-green-600" />
            )}
          </View>
          <View className="ml-6">
            <Tooltip>
              <TooltipTrigger>
                {customer.phoneNumber && (
                  <View className="flex-row items-center gap-2">
                    <Icon as={Phone} size={16} className="text-ring" />
                    <View className="items-start text-primary">
                      <View className="flex-row items-center">
                        <Text className="text-sm text-ring">
                          {formatPhoneBrazil(customer.phoneNumber.value)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </TooltipTrigger>
              <TooltipContent>
                <Text>Número de telefone do cliente</Text>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                {customer.landlineNumber && (
                  <View className="flex-row items-center gap-2">
                    <Icon as={UtilityPole} size={16} className="text-ring" />
                    <View className="items-start text-primary">
                      <View className="flex-row items-center">
                        <Text className="text-sm text-ring">
                          {formatPhoneBrazil(customer.landlineNumber.value)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </TooltipTrigger>
              <TooltipContent>
                <Text>Número de telefone fixo do cliente</Text>
              </TooltipContent>
            </Tooltip>
          </View>
        </ObjectCard.Content>
      </ObjectCard.Root>
    )
  }

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const renderFooter = () => {
    if (!isFetchingNextPage) return <View className="h-4" />
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" />
        <Text className="text-sm text-muted-foreground mt-2">
          Carregando mais clientes...
        </Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4">Carregando clientes...</Text>
      </SafeAreaView>
    )
  }

  const totalCustomers = data?.pages[0]?.totalCount ?? 0

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
      {totalCustomers === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhum cliente cadastrado.{' \n'}
            Clique no + para adicionar.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <ActiveFiltersBanner
            filters={activeFilters}
            clearFiltersHref="/customers"
          />
          {displayedCustomers.length === 0 ? (
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-center text-muted-foreground">
                Nenhum cliente encontrado com os filtros aplicados.
              </Text>
            </View>
          ) : (
            <View className="flex-1 px-4">
              <FlashList
                data={displayedCustomers}
                renderItem={({ item }) => renderItem(item as Customer)}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
              />
            </View>
          )}
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
        </View>
      )}
    </SafeAreaView>
  )
}
