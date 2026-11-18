import { useDebouncedValue } from '@/src/application/hooks/use-debounced-value'
import { Button } from '@/src/components/ui/button'
import { DatePickerInput } from '@/src/components/ui/date-picker-input'
import { FloatingLabelInput } from '@/src/components/ui/floating-label-input'
import { Icon } from '@/src/components/ui/icon'
import { Input } from '@/src/components/ui/input'
import { Masks } from '@/src/components/ui/masks'
import { Text } from '@/src/components/ui/text'
import {
  isNextVisitPreset,
  NEXT_VISIT_PRESETS,
} from '@/src/lib/next-visit-period'
import {
  isPeriodPreset,
  parseDay,
  PERIOD_PRESETS,
  toDayString,
} from '@/src/lib/work-order-period'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Search, X } from 'lucide-react-native'
import * as React from 'react'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WorkOrdersSearch() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    search?: string
    phoneNumber?: string
    landlineNumber?: string
    isWhatsApp?: string
    scheduledDate?: string // legacy single day
    scheduledPeriod?: string
    scheduledFrom?: string
    scheduledTo?: string
    nextVisitPeriod?: string
    nextVisitFrom?: string
    nextVisitTo?: string
    hasNextVisit?: string
    visitDate?: string
    minTotalValue?: string
    maxTotalValue?: string
    isPaid?: string
    hasPayment?: string
    hasResult?: string
    isExpired?: string
    isCopied?: string
  }>()

  const [searchQuery, setSearchQuery] = useState(params.search || '')
  const [phoneNumberFilter, setPhoneNumberFilter] = useState(
    (params.phoneNumber as string) || ''
  )
  const [landlineNumberFilter, setLandlineNumberFilter] = useState(
    (params.landlineNumber as string) || ''
  )
  const [isWhatsAppFilter, setIsWhatsAppFilter] = useState<
    'all' | 'true' | 'false'
  >((params.isWhatsApp as any) || 'all')
  // Scheduled period: a relative preset ("this-month") or a custom range.
  // The legacy single-day filter becomes the equivalent preset/range.
  const legacyDay =
    params.scheduledDate && params.scheduledDate !== 'today'
      ? parseDay(params.scheduledDate)
      : undefined
  const [periodPreset, setPeriodPreset] = useState<string | undefined>(
    isPeriodPreset(params.scheduledPeriod)
      ? params.scheduledPeriod
      : params.scheduledDate === 'today'
        ? 'today'
        : undefined
  )
  const [periodFrom, setPeriodFrom] = useState<Date | undefined>(
    parseDay(params.scheduledFrom) ?? legacyDay
  )
  const [periodTo, setPeriodTo] = useState<Date | undefined>(
    parseDay(params.scheduledTo) ?? legacyDay
  )

  const selectPreset = (value: string) => {
    // Tapping the active preset clears it
    setPeriodPreset((current) => (current === value ? undefined : value))
    setPeriodFrom(undefined)
    setPeriodTo(undefined)
  }
  const selectFrom = (date: Date) => {
    setPeriodPreset(undefined)
    setPeriodFrom(date)
    if (periodTo && date > periodTo) setPeriodTo(date)
  }
  const selectTo = (date: Date) => {
    setPeriodPreset(undefined)
    setPeriodTo(date)
    if (periodFrom && date < periodFrom) setPeriodFrom(date)
  }
  const periodParams = {
    scheduledDate: undefined, // replaced by the period params
    scheduledPeriod: periodPreset,
    scheduledFrom: periodFrom ? toDayString(periodFrom) : undefined,
    scheduledTo: periodTo ? toDayString(periodTo) : undefined,
  }
  // Next visit reminder: same shape as the scheduled period
  const [nextVisitPreset, setNextVisitPreset] = useState<string | undefined>(
    isNextVisitPreset(params.nextVisitPeriod)
      ? params.nextVisitPeriod
      : undefined
  )
  const [nextVisitFrom, setNextVisitFrom] = useState<Date | undefined>(
    parseDay(params.nextVisitFrom)
  )
  const [nextVisitTo, setNextVisitTo] = useState<Date | undefined>(
    parseDay(params.nextVisitTo)
  )
  const [hasNextVisitFilter, setHasNextVisitFilter] = useState<
    'all' | 'true' | 'false'
  >((params.hasNextVisit as any) || 'all')
  const selectNextVisitPreset = (value: string) => {
    setNextVisitPreset((current) => (current === value ? undefined : value))
    setNextVisitFrom(undefined)
    setNextVisitTo(undefined)
  }
  const selectNextVisitFrom = (date: Date) => {
    setNextVisitPreset(undefined)
    setNextVisitFrom(date)
    if (nextVisitTo && date > nextVisitTo) setNextVisitTo(date)
  }
  const selectNextVisitTo = (date: Date) => {
    setNextVisitPreset(undefined)
    setNextVisitTo(date)
    if (nextVisitFrom && date < nextVisitFrom) setNextVisitFrom(date)
  }
  const nextVisitParams = {
    nextVisitPeriod: nextVisitPreset,
    nextVisitFrom: nextVisitFrom ? toDayString(nextVisitFrom) : undefined,
    nextVisitTo: nextVisitTo ? toDayString(nextVisitTo) : undefined,
    hasNextVisit: hasNextVisitFilter !== 'all' ? hasNextVisitFilter : undefined,
  }
  const [visitDateFilter, setVisitDateFilter] = useState<Date | undefined>(
    params.visitDate ? new Date(params.visitDate) : undefined
  )
  const [minTotalValueFilter, setMinTotalValueFilter] = useState(
    (params.minTotalValue as string) || ''
  )
  const [maxTotalValueFilter, setMaxTotalValueFilter] = useState(
    (params.maxTotalValue as string) || ''
  )
  const [isPaidFilter, setIsPaidFilter] = useState<'all' | 'true' | 'false'>(
    (params.isPaid as any) || 'all'
  )
  const [hasPaymentFilter, setHasPaymentFilter] = useState<
    'all' | 'true' | 'false'
  >((params.hasPayment as any) || 'all')
  const [hasResultFilter, setHasResultFilter] = useState<
    'all' | 'true' | 'false'
  >((params.hasResult as any) || 'all')
  const [isExpiredFilter, setIsExpiredFilter] = useState<
    'all' | 'true' | 'false'
  >((params.isExpired as any) || 'all')
  const [isCopiedFilter, setIsCopiedFilter] = useState<
    'all' | 'true' | 'false'
  >((params.isCopied as any) || 'all')

  // Debounce the text inputs (300ms)
  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const debouncedPhoneNumber = useDebouncedValue(phoneNumberFilter, 300)
  const debouncedLandlineNumber = useDebouncedValue(landlineNumberFilter, 300)
  const debouncedMinTotalValue = useDebouncedValue(minTotalValueFilter, 300)
  const debouncedMaxTotalValue = useDebouncedValue(maxTotalValueFilter, 300)

  // Auto-apply filters when debounced values change
  React.useEffect(() => {
    const filters = {
      search: debouncedSearch || undefined,
      phoneNumber: debouncedPhoneNumber || undefined,
      landlineNumber: debouncedLandlineNumber || undefined,
      isWhatsApp: isWhatsAppFilter !== 'all' ? isWhatsAppFilter : undefined,
      ...periodParams,
      ...nextVisitParams,
      visitDate: visitDateFilter ? visitDateFilter.toISOString() : undefined,
      minTotalValue: debouncedMinTotalValue || undefined,
      maxTotalValue: debouncedMaxTotalValue || undefined,
      isPaid: isPaidFilter !== 'all' ? isPaidFilter : undefined,
      hasPayment: hasPaymentFilter !== 'all' ? hasPaymentFilter : undefined,
      hasResult: hasResultFilter !== 'all' ? hasResultFilter : undefined,
      isExpired: isExpiredFilter !== 'all' ? isExpiredFilter : undefined,
      isCopied: isCopiedFilter !== 'all' ? isCopiedFilter : undefined,
    }

    router.setParams(filters)
  }, [
    debouncedSearch,
    debouncedPhoneNumber,
    debouncedLandlineNumber,
    isWhatsAppFilter,
    periodPreset,
    periodFrom,
    periodTo,
    nextVisitPreset,
    nextVisitFrom,
    nextVisitTo,
    hasNextVisitFilter,
    visitDateFilter,
    debouncedMinTotalValue,
    debouncedMaxTotalValue,
    isPaidFilter,
    hasPaymentFilter,
    hasResultFilter,
    isExpiredFilter,
    isCopiedFilter,
  ])

  const applyFilters = () => {
    router.back()

    setTimeout(() => {
      router.setParams({
        search: searchQuery || undefined,
        phoneNumber: phoneNumberFilter || undefined,
        landlineNumber: landlineNumberFilter || undefined,
        isWhatsApp: isWhatsAppFilter !== 'all' ? isWhatsAppFilter : undefined,
        ...periodParams,
        ...nextVisitParams,
        visitDate: visitDateFilter ? visitDateFilter.toISOString() : undefined,
        minTotalValue: minTotalValueFilter || undefined,
        maxTotalValue: maxTotalValueFilter || undefined,
        isPaid: isPaidFilter !== 'all' ? isPaidFilter : undefined,
        hasPayment: hasPaymentFilter !== 'all' ? hasPaymentFilter : undefined,
        hasResult: hasResultFilter !== 'all' ? hasResultFilter : undefined,
        isExpired: isExpiredFilter !== 'all' ? isExpiredFilter : undefined,
        isCopied: isCopiedFilter !== 'all' ? isCopiedFilter : undefined,
      })
    }, 200)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setPhoneNumberFilter('')
    setLandlineNumberFilter('')
    setIsWhatsAppFilter('all')
    setPeriodPreset(undefined)
    setPeriodFrom(undefined)
    setPeriodTo(undefined)
    setNextVisitPreset(undefined)
    setNextVisitFrom(undefined)
    setNextVisitTo(undefined)
    setHasNextVisitFilter('all')
    setVisitDateFilter(undefined)
    setMinTotalValueFilter('')
    setMaxTotalValueFilter('')
    setIsPaidFilter('all')
    setHasPaymentFilter('all')
    setHasResultFilter('all')
    setIsExpiredFilter('all')
    setIsCopiedFilter('all')
  }

  const hasActiveFilters =
    searchQuery !== '' ||
    phoneNumberFilter !== '' ||
    landlineNumberFilter !== '' ||
    isWhatsAppFilter !== 'all' ||
    periodPreset !== undefined ||
    periodFrom !== undefined ||
    periodTo !== undefined ||
    nextVisitPreset !== undefined ||
    nextVisitFrom !== undefined ||
    nextVisitTo !== undefined ||
    hasNextVisitFilter !== 'all' ||
    visitDateFilter !== undefined ||
    minTotalValueFilter !== '' ||
    maxTotalValueFilter !== '' ||
    isPaidFilter !== 'all' ||
    hasPaymentFilter !== 'all' ||
    hasResultFilter !== 'all' ||
    isExpiredFilter !== 'all' ||
    isCopiedFilter !== 'all'

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1">
      <Stack.Screen options={{ title: 'Filtrar Ordens de Serviço' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={80}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1 }}>
            <View className="gap-4 p-4 flex-1">
              <View className="relative">
                <Icon
                  as={Search}
                  className="text-muted-foreground absolute left-3 top-2.5 z-10"
                  size={20}
                />
                <Input
                  placeholder="Pesquisar por cliente..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="pl-10 pr-10"
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

              <FloatingLabelInput
                label="Telefone"
                mask={Masks.BRL_PHONE}
                placeholder="Ex. (11) 91234-5678"
                value={phoneNumberFilter}
                onChangeText={setPhoneNumberFilter}
                keyboardType="phone-pad"
                gap={2}
              />

              <FloatingLabelInput
                label="Telefone Fixo"
                mask={Masks.BRL_LANDLINE_PHONE}
                placeholder="Ex. (11) 3456-7890"
                value={landlineNumberFilter}
                onChangeText={setLandlineNumberFilter}
                keyboardType="phone-pad"
                gap={2}
              />

              <View className="gap-2">
                <Text className="text-sm font-medium">WhatsApp</Text>
                <View className="flex-row gap-2">
                  <Button
                    variant={isWhatsAppFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setIsWhatsAppFilter('all')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isWhatsAppFilter === 'all'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Todos
                    </Text>
                  </Button>
                  <Button
                    variant={
                      isWhatsAppFilter === 'true' ? 'default' : 'outline'
                    }
                    size="sm"
                    onPress={() => setIsWhatsAppFilter('true')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isWhatsAppFilter === 'true'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Sim
                    </Text>
                  </Button>
                  <Button
                    variant={
                      isWhatsAppFilter === 'false' ? 'default' : 'outline'
                    }
                    size="sm"
                    onPress={() => setIsWhatsAppFilter('false')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isWhatsAppFilter === 'false'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Não
                    </Text>
                  </Button>
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium">Período agendado</Text>
                <View className="flex-row flex-wrap gap-2">
                  {PERIOD_PRESETS.map((preset) => {
                    const active = periodPreset === preset.value
                    return (
                      <Button
                        key={preset.value}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onPress={() => selectPreset(preset.value)}
                      >
                        <Text
                          className={
                            active
                              ? 'text-primary-foreground'
                              : 'text-foreground'
                          }
                        >
                          {preset.label}
                        </Text>
                      </Button>
                    )
                  })}
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <DatePickerInput
                      label="De"
                      placeholder="Início"
                      value={periodFrom}
                      onDateChange={selectFrom}
                    />
                  </View>
                  <View className="flex-1">
                    <DatePickerInput
                      label="Até"
                      placeholder="Fim"
                      value={periodTo}
                      onDateChange={selectTo}
                    />
                  </View>
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium">Próxima visita</Text>
                <View className="flex-row flex-wrap gap-2">
                  {NEXT_VISIT_PRESETS.map((preset) => {
                    const active = nextVisitPreset === preset.value
                    return (
                      <Button
                        key={preset.value}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onPress={() => selectNextVisitPreset(preset.value)}
                      >
                        <Text
                          className={
                            active
                              ? 'text-primary-foreground'
                              : 'text-foreground'
                          }
                        >
                          {preset.label}
                        </Text>
                      </Button>
                    )
                  })}
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <DatePickerInput
                      label="De"
                      placeholder="Início"
                      value={nextVisitFrom}
                      onDateChange={selectNextVisitFrom}
                    />
                  </View>
                  <View className="flex-1">
                    <DatePickerInput
                      label="Até"
                      placeholder="Fim"
                      value={nextVisitTo}
                      onDateChange={selectNextVisitTo}
                    />
                  </View>
                </View>
                <View className="flex-row gap-2">
                  {(
                    [
                      ['all', 'Todas'],
                      ['true', 'Com próxima visita'],
                      ['false', 'Sem'],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      variant={
                        hasNextVisitFilter === value ? 'default' : 'outline'
                      }
                      size="sm"
                      onPress={() => setHasNextVisitFilter(value)}
                      className="flex-1"
                    >
                      <Text
                        className={
                          hasNextVisitFilter === value
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                        }
                      >
                        {label}
                      </Text>
                    </Button>
                  ))}
                </View>
              </View>

              <DatePickerInput
                label="Data de Visita"
                placeholder="Selecione a data"
                value={visitDateFilter}
                onDateChange={setVisitDateFilter}
              />

              <FloatingLabelInput
                label="Valor Total Mínimo"
                mask={Masks.BRL_CURRENCY}
                placeholder="Ex. R$ 100,00"
                value={minTotalValueFilter}
                onChangeText={setMinTotalValueFilter}
                keyboardType="numeric"
                gap={2}
              />

              <FloatingLabelInput
                label="Valor Total Máximo"
                mask={Masks.BRL_CURRENCY}
                placeholder="Ex. R$ 1.000,00"
                value={maxTotalValueFilter}
                onChangeText={setMaxTotalValueFilter}
                keyboardType="numeric"
                gap={2}
              />

              <View className="gap-2">
                <Text className="text-sm font-medium">
                  Ordem de pagamento criada
                </Text>
                <View className="flex-row gap-2">
                  <Button
                    variant={hasPaymentFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setHasPaymentFilter('all')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        hasPaymentFilter === 'all'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Todos
                    </Text>
                  </Button>
                  <Button
                    variant={
                      hasPaymentFilter === 'true' ? 'default' : 'outline'
                    }
                    size="sm"
                    onPress={() => setHasPaymentFilter('true')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        hasPaymentFilter === 'true'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Sim
                    </Text>
                  </Button>
                  <Button
                    variant={
                      hasPaymentFilter === 'false' ? 'default' : 'outline'
                    }
                    size="sm"
                    onPress={() => setHasPaymentFilter('false')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        hasPaymentFilter === 'false'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Não
                    </Text>
                  </Button>
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium">Status de Pagamento</Text>
                <View className="flex-row gap-2">
                  <Button
                    variant={isPaidFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setIsPaidFilter('all')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isPaidFilter === 'all'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Todos
                    </Text>
                  </Button>
                  <Button
                    variant={isPaidFilter === 'true' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setIsPaidFilter('true')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isPaidFilter === 'true'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Pago
                    </Text>
                  </Button>
                  <Button
                    variant={isPaidFilter === 'false' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setIsPaidFilter('false')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isPaidFilter === 'false'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Pendente
                    </Text>
                  </Button>
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium">
                  Relatório da ordem de serviço criado
                </Text>
                <View className="flex-row gap-2">
                  <Button
                    variant={hasResultFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setHasResultFilter('all')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        hasResultFilter === 'all'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Todos
                    </Text>
                  </Button>
                  <Button
                    variant={hasResultFilter === 'true' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setHasResultFilter('true')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        hasResultFilter === 'true'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Sim
                    </Text>
                  </Button>
                  <Button
                    variant={
                      hasResultFilter === 'false' ? 'default' : 'outline'
                    }
                    size="sm"
                    onPress={() => setHasResultFilter('false')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        hasResultFilter === 'false'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Não
                    </Text>
                  </Button>
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium">Ordem Expirada</Text>
                <View className="flex-row gap-2">
                  <Button
                    variant={isExpiredFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setIsExpiredFilter('all')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isExpiredFilter === 'all'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Todos
                    </Text>
                  </Button>
                  <Button
                    variant={isExpiredFilter === 'true' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setIsExpiredFilter('true')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isExpiredFilter === 'true'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Sim
                    </Text>
                  </Button>
                  <Button
                    variant={
                      isExpiredFilter === 'false' ? 'default' : 'outline'
                    }
                    size="sm"
                    onPress={() => setIsExpiredFilter('false')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isExpiredFilter === 'false'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Não
                    </Text>
                  </Button>
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium">Ordem Clonada</Text>
                <View className="flex-row gap-2">
                  <Button
                    variant={isCopiedFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setIsCopiedFilter('all')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isCopiedFilter === 'all'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Todos
                    </Text>
                  </Button>
                  <Button
                    variant={isCopiedFilter === 'true' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setIsCopiedFilter('true')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isCopiedFilter === 'true'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Sim
                    </Text>
                  </Button>
                  <Button
                    variant={isCopiedFilter === 'false' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setIsCopiedFilter('false')}
                    className="flex-1"
                  >
                    <Text
                      className={
                        isCopiedFilter === 'false'
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      Não
                    </Text>
                  </Button>
                </View>
              </View>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onPress={clearAllFilters}>
                  <Icon as={X} size={16} className="text-foreground mr-2" />
                  <Text>Limpar filtros</Text>
                </Button>
              )}
            </View>
          </View>
        </ScrollView>
        <View className="gap-2 px-4 pb-4 bg-background">
          <Button onPress={applyFilters}>
            <Text className="text-primary-foreground font-medium">
              Aplicar Filtros
            </Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
