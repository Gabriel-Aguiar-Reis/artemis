import { Button } from '@/src/components/ui/button'
import { FloatingLabelInput } from '@/src/components/ui/floating-label-input'
import { Icon } from '@/src/components/ui/icon'
import { Input } from '@/src/components/ui/input'
import { Masks } from '@/src/components/ui/masks'
import { Text } from '@/src/components/ui/text'
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
    scheduledDate?: string
    visitDate?: string
    minTotalValue?: string
    maxTotalValue?: string
    isPaid?: string
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
  const [scheduledDateFilter, setScheduledDateFilter] = useState(
    (params.scheduledDate as string) || ''
  )
  const [visitDateFilter, setVisitDateFilter] = useState(
    (params.visitDate as string) || ''
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

  const applyFilters = () => {
    router.back()

    setTimeout(() => {
      router.setParams({
        search: searchQuery || undefined,
        phoneNumber: phoneNumberFilter || undefined,
        landlineNumber: landlineNumberFilter || undefined,
        isWhatsApp: isWhatsAppFilter !== 'all' ? isWhatsAppFilter : undefined,
        scheduledDate: scheduledDateFilter || undefined,
        visitDate: visitDateFilter || undefined,
        minTotalValue: minTotalValueFilter || undefined,
        maxTotalValue: maxTotalValueFilter || undefined,
        isPaid: isPaidFilter !== 'all' ? isPaidFilter : undefined,
      })
    }, 200)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setPhoneNumberFilter('')
    setLandlineNumberFilter('')
    setIsWhatsAppFilter('all')
    setScheduledDateFilter('')
    setVisitDateFilter('')
    setMinTotalValueFilter('')
    setMaxTotalValueFilter('')
    setIsPaidFilter('all')
  }

  const hasActiveFilters =
    searchQuery !== '' ||
    phoneNumberFilter !== '' ||
    landlineNumberFilter !== '' ||
    isWhatsAppFilter !== 'all' ||
    scheduledDateFilter !== '' ||
    visitDateFilter !== '' ||
    minTotalValueFilter !== '' ||
    maxTotalValueFilter !== '' ||
    isPaidFilter !== 'all'

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: 'Filtrar Ordens de Serviço' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={80}
      >
        <ScrollView>
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

              <FloatingLabelInput
                label="Data Agendada"
                mask={Masks.DATE_DDMMYYYY}
                placeholder="Ex. 01/12/2025"
                value={scheduledDateFilter}
                onChangeText={setScheduledDateFilter}
                keyboardType="numeric"
                gap={2}
              />

              <FloatingLabelInput
                label="Data de Visita"
                mask={Masks.DATE_DDMMYYYY}
                placeholder="Ex. 01/12/2025"
                value={visitDateFilter}
                onChangeText={setVisitDateFilter}
                keyboardType="numeric"
                gap={2}
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
