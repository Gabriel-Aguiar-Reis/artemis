import { useDebouncedValue } from '@/src/application/hooks/use-debounced-value'
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
import { CustomerLight } from '@/src/domain/repositories/customer/customer.repository'
import DrizzleCustomerRepository from '@/src/infra/repositories/drizzle/drizzle.customer.repository'
import { cn, formatPhoneBrazil } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Check,
  ChevronDown,
  MapPinHouse,
  Phone,
  Search,
  Store,
  UserSquare2,
  X,
} from 'lucide-react-native'
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  View,
} from 'react-native'

const customerRepo = new DrizzleCustomerRepository()
const SEARCH_LIMIT = 50
const keyExtractor = (item: CustomerLight) => item.id

type CustomerItemProps = {
  item: CustomerLight
  selected: boolean
  onSelect: (customer: CustomerLight) => void
}

const CustomerItem = React.memo(function CustomerItem({
  item,
  selected,
  onSelect,
}: CustomerItemProps) {
  return (
    <Pressable
      onPress={() => onSelect(item)}
      className={cn(
        'p-4 border-b border-border w-full',
        selected && 'bg-accent/50'
      )}
    >
      <View className="flex-row justify-between items-start w-full">
        <View className="flex-1 gap-1">
          <View className="flex-row gap-2 items-center">
            <Icon as={Store} size={18} className="text-muted-foreground" />
            <Text className="font-semibold text-base flex-1">
              {item.storeName}
            </Text>
          </View>
          <View className="flex-row gap-2 items-center">
            <Icon as={UserSquare2} size={14} className="text-foreground" />
            <Text className="text-sm font-medium">{item.contactName}</Text>
          </View>
          {!!item.city && (
            <View className="flex-row gap-2 items-center">
              <Icon
                as={MapPinHouse}
                size={14}
                className="text-muted-foreground"
              />
              <Text className="text-sm text-muted-foreground">{item.city}</Text>
            </View>
          )}
          {!!item.phone && (
            <View className="flex-row items-center gap-2">
              <Icon as={Phone} size={12} className="text-muted-foreground" />
              <Text className="text-xs text-muted-foreground">
                {formatPhoneBrazil(item.phone)}
              </Text>
            </View>
          )}
        </View>
        {selected && (
          <View className="bg-primary rounded-full p-1">
            <Icon as={Check} size={16} className="text-primary-foreground" />
          </View>
        )}
      </View>
    </Pressable>
  )
})

type CustomerComboboxProps = {
  selectedCustomerId: string
  onCustomerChange: (customerId: string) => void
  label?: string
  placeholder?: string
  error?: string
}

export function CustomerCombobox({
  selectedCustomerId,
  onCustomerChange,
  label = 'Cliente',
  placeholder = 'Selecione um cliente',
  error,
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 250)

  // Lightweight SQL search (50 results, accent-insensitive) only while the dialog is open
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['customers', 'search-light', debouncedQuery],
    queryFn: () =>
      customerRepo.searchCustomersLight(debouncedQuery, SEARCH_LIMIT),
    enabled: open,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })

  // Already selected customer (e.g. editing) even outside the 50 results
  const { data: selectedCustomer } = useQuery({
    queryKey: ['customers', 'byId', selectedCustomerId],
    queryFn: () => customerRepo.getCustomer(selectedCustomerId as any),
    enabled: !!selectedCustomerId,
    staleTime: 1000 * 60 * 5,
  })

  const selectedCustomerText = selectedCustomerId
    ? selectedCustomer?.storeName || placeholder
    : placeholder

  const handleSelect = useCallback(
    (customer: CustomerLight) => {
      onCustomerChange(customer.id)
      setOpen(false)
    },
    [onCustomerChange]
  )

  const renderCustomerItem = useCallback(
    ({ item }: { item: CustomerLight }) => (
      <CustomerItem
        item={item}
        selected={item.id === selectedCustomerId}
        onSelect={handleSelect}
      />
    ),
    [selectedCustomerId, handleSelect]
  )

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
          className={cn(
            'bg-background',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {label}
        </Animated.Text>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Pressable
            className={cn(
              'flex-row items-center justify-between h-12 px-4 rounded-md',
              'border bg-background',
              'active:bg-accent',
              error ? 'border-destructive' : 'border-input'
            )}
          >
            <View className="flex-row items-center gap-2 flex-1">
              <Icon
                as={Store}
                size={20}
                className={cn(
                  'text-muted-foreground',
                  error && 'text-destructive'
                )}
              />
              <Text
                className={cn(
                  'flex-1',
                  !selectedCustomerId && 'text-muted-foreground',
                  error && 'text-destructive'
                )}
                numberOfLines={1}
              >
                {selectedCustomerText}
              </Text>
            </View>
            <Icon
              as={ChevronDown}
              size={20}
              className={cn(
                'text-muted-foreground',
                error && 'text-destructive'
              )}
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
                  accessibilityLabel="Limpar busca"
                  className="absolute right-3 top-2.5"
                >
                  <Icon as={X} className="text-muted-foreground" size={20} />
                </Pressable>
              )}
            </View>

            {isLoading ? (
              <View className="flex-1 items-center justify-center gap-2">
                <ActivityIndicator />
                <Text className="text-muted-foreground">
                  Carregando clientes...
                </Text>
              </View>
            ) : results.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted-foreground text-center">
                  {debouncedQuery
                    ? 'Nenhum cliente encontrado com esse nome'
                    : 'Nenhum cliente cadastrado'}
                </Text>
              </View>
            ) : (
              <View className="flex-1 w-full">
                <FlashList
                  data={results}
                  renderItem={renderCustomerItem}
                  keyExtractor={keyExtractor}
                  extraData={selectedCustomerId}
                  keyboardShouldPersistTaps="handled"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <View className="min-h-4 justify-center">
        {error && (
          <Text className="ml-2 text-xs text-destructive">{error}</Text>
        )}
      </View>
    </View>
  )
}
