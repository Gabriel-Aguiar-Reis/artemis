import { customerHooks } from '@/src/application/hooks/customer.hooks'
import { Button } from '@/src/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Icon } from '@/src/components/ui/icon'
import { Input } from '@/src/components/ui/input'
import { Text } from '@/src/components/ui/text'
import { WhatsAppIcon } from '@/src/components/ui/whatsapp-icon'
import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { cn, formatPhoneBrazil } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import {
  Check,
  ChevronDown,
  MapPinHouse,
  Phone,
  Search,
  Store,
  UserSquare2,
  UtilityPole,
  X,
} from 'lucide-react-native'
import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, View } from 'react-native'

type CustomerComboboxProps = {
  selectedCustomerId: string
  onCustomerChange: (customerId: string) => void
  label?: string
  placeholder?: string
}

export function CustomerCombobox({
  selectedCustomerId,
  onCustomerChange,
  label = 'Cliente',
  placeholder = 'Selecione um cliente',
}: CustomerComboboxProps) {
  const { data: customers = [], isLoading } = customerHooks.getCustomers()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers
    return customers.filter(
      (c) =>
        c.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [customers, searchQuery])

  const isCustomerSelected = (customerId: string) => {
    return selectedCustomerId === customerId
  }

  const toggleCustomer = (customer: Customer) => {
    onCustomerChange(customer.id)
    setOpen(false)
  }

  const selectedCustomerText = useMemo(() => {
    if (!selectedCustomerId) return placeholder
    const customer = customers.find((c) => c.id === selectedCustomerId)
    return customer?.storeName || placeholder
  }, [selectedCustomerId, customers, placeholder])

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const selected = isCustomerSelected(item.id)
    const address = `${item.storeAddress.streetName}, ${item.storeAddress.streetNumber}, ${item.storeAddress.city} - ${item.storeAddress.state}`

    return (
      <View className="min-h-[120px] w-full">
        <Pressable
          onPress={() => toggleCustomer(item)}
          className={cn(
            'p-4 border-b border-border w-full',
            selected && 'bg-accent/50'
          )}
        >
          <View className="flex-row justify-between items-start w-full">
            <View className="flex-1">
              {/* Nome da Loja */}
              <View className="flex-row gap-2 items-center mb-2">
                <Icon as={Store} size={18} className="text-primary" />
                <Text className="font-semibold text-base">
                  {item.storeName}
                </Text>
              </View>

              {/* Endereço */}
              <View className="flex-row gap-2 items-start mb-2">
                <Icon
                  as={MapPinHouse}
                  size={14}
                  className="text-muted-foreground mt-0.5"
                />
                <Text className="text-sm text-muted-foreground flex-1">
                  {address}
                </Text>
              </View>

              {/* Nome do Contato */}
              <View className="flex-row gap-2 items-center mb-1">
                <Icon as={UserSquare2} size={14} className="text-foreground" />
                <Text className="text-sm font-medium">{item.contactName}</Text>
                {item.isActiveWhatsApp() && (
                  <WhatsAppIcon size={14} className="text-green-600" />
                )}
              </View>

              {/* Telefones */}
              <View className="ml-5 gap-1">
                {item.phoneNumber && (
                  <View className="flex-row items-center gap-2">
                    <Icon
                      as={Phone}
                      size={12}
                      className="text-muted-foreground"
                    />
                    <Text className="text-xs text-muted-foreground">
                      {formatPhoneBrazil(item.phoneNumber.value)}
                    </Text>
                  </View>
                )}
                {item.landlineNumber && (
                  <View className="flex-row items-center gap-2">
                    <Icon
                      as={UtilityPole}
                      size={12}
                      className="text-muted-foreground"
                    />
                    <Text className="text-xs text-muted-foreground">
                      {formatPhoneBrazil(item.landlineNumber.value)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {selected && (
              <View className="bg-primary rounded-full p-1">
                <Icon
                  as={Check}
                  size={16}
                  className="text-primary-foreground"
                />
              </View>
            )}
          </View>
        </Pressable>
      </View>
    )
  }

  const hasValue = !!selectedCustomerId
  const shouldFloat = hasValue || open
  const animated = useRef(new Animated.Value(shouldFloat ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(animated, {
      toValue: shouldFloat ? 1 : 0,
      duration: 80,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start()
  }, [shouldFloat])

  const labelStyle = {
    position: 'absolute' as const,
    left: 8,
    paddingHorizontal: 2,
    zIndex: 10,
    top: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [-8, -8],
    }),
    fontSize: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [12, 12],
    }),
  }

  return (
    <View className="relative">
      {label && (
        <Animated.Text
          style={labelStyle}
          numberOfLines={1}
          className="bg-background text-muted-foreground"
        >
          {label}
        </Animated.Text>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Pressable
            className={cn(
              'flex-row items-center justify-between h-12 px-4 rounded-md',
              'border border-input bg-background',
              'active:bg-accent'
            )}
          >
            <View className="flex-row items-center gap-2 flex-1">
              <Icon as={Store} size={20} className="text-muted-foreground" />
              <Text
                className={cn(
                  'flex-1',
                  !selectedCustomerId && 'text-muted-foreground'
                )}
                numberOfLines={1}
              >
                {selectedCustomerText}
              </Text>
            </View>
            <Icon
              as={ChevronDown}
              size={20}
              className="text-muted-foreground"
            />
          </Pressable>
        </DialogTrigger>

        <DialogContent className="w-80 h-3/4 max-w-[90%]">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>

          <View className="flex-1 w-full">
            <View className="relative mb-4 w-full">
              <Icon
                as={Search}
                className="text-muted-foreground absolute left-3 top-2.5 z-10"
                size={20}
              />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="pl-10 pr-10 w-full"
              />
              {searchQuery !== '' && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5"
                >
                  <Icon as={X} className="text-muted-foreground" size={20} />
                </Pressable>
              )}
            </View>

            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted-foreground">
                  Carregando clientes...
                </Text>
              </View>
            ) : filteredCustomers.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted-foreground text-center">
                  {searchQuery
                    ? 'Nenhum cliente encontrado com esse nome'
                    : 'Nenhum cliente cadastrado'}
                </Text>
              </View>
            ) : (
              <View className="flex-1 w-full">
                <FlashList
                  data={filteredCustomers}
                  renderItem={renderCustomerItem}
                />
              </View>
            )}
          </View>

          <DialogFooter className="flex-row gap-2">
            <DialogClose asChild className="flex-1">
              <Button variant="outline">
                <Text>Cancelar</Text>
              </Button>
            </DialogClose>
            <DialogClose asChild className="flex-1">
              <Button>
                <Text>Confirmar</Text>
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <View className="min-h-4" />
    </View>
  )
}
