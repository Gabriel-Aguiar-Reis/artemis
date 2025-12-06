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
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CustomerSearchScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    search?: string
    contactName?: string
    phoneNumber?: string
    landlineNumber?: string
    isActiveWhatsApp?: string
  }>()

  const [searchQuery, setSearchQuery] = useState(params.search || '')
  const [contactNameFilter, setContactNameFilter] = useState(
    (params.contactName as string) || ''
  )
  const [phoneNumberFilter, setPhoneNumberFilter] = useState(
    (params.phoneNumber as string) || ''
  )
  const [landlineNumberFilter, setLandlineNumberFilter] = useState(
    (params.landlineNumber as string) || ''
  )

  const [isActiveWhatsAppFilter, setIsActiveWhatsAppFilter] = useState<
    'all' | 'true' | 'false'
  >((params.isActiveWhatsApp as any) || 'all')

  const applyFilters = () => {
    router.back()

    setTimeout(() => {
      router.setParams({
        search: searchQuery || undefined,
        contactName: contactNameFilter || undefined,
        phoneNumber: phoneNumberFilter || undefined,
        landlineNumber: landlineNumberFilter || undefined,
        isActiveWhatsApp:
          isActiveWhatsAppFilter !== 'all' ? isActiveWhatsAppFilter : undefined,
      })
    }, 200)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setContactNameFilter('')
    setPhoneNumberFilter('')
    setLandlineNumberFilter('')
    setIsActiveWhatsAppFilter('all')
  }

  const hasActiveFilters =
    searchQuery !== '' ||
    contactNameFilter !== '' ||
    phoneNumberFilter !== '' ||
    landlineNumberFilter !== '' ||
    isActiveWhatsAppFilter !== 'all'

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: 'Filtrar Clientes' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={80}
      >
        <View style={{ flex: 1 }}>
          <View className="gap-4 p-4 flex-1">
            <View className="relative">
              <Icon
                as={Search}
                className="text-muted-foreground absolute left-3 top-2.5 z-10"
                size={20}
              />
              <Input
                placeholder="Pesquisar por loja ou contato..."
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
              label="Nome do Contato"
              placeholder="Ex. João Silva"
              value={contactNameFilter}
              onChangeText={setContactNameFilter}
              gap={2}
            />

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
                  variant={
                    isActiveWhatsAppFilter === 'all' ? 'default' : 'outline'
                  }
                  size="sm"
                  onPress={() => setIsActiveWhatsAppFilter('all')}
                  className="flex-1"
                >
                  <Text
                    className={
                      isActiveWhatsAppFilter === 'all'
                        ? 'text-primary-foreground'
                        : 'text-foreground'
                    }
                  >
                    Todos
                  </Text>
                </Button>
                <Button
                  variant={
                    isActiveWhatsAppFilter === 'true' ? 'default' : 'outline'
                  }
                  size="sm"
                  onPress={() => setIsActiveWhatsAppFilter('true')}
                  className="flex-1"
                >
                  <Text
                    className={
                      isActiveWhatsAppFilter === 'true'
                        ? 'text-primary-foreground'
                        : 'text-foreground'
                    }
                  >
                    Sim
                  </Text>
                </Button>
                <Button
                  variant={
                    isActiveWhatsAppFilter === 'false' ? 'default' : 'outline'
                  }
                  size="sm"
                  onPress={() => setIsActiveWhatsAppFilter('false')}
                  className="flex-1"
                >
                  <Text
                    className={
                      isActiveWhatsAppFilter === 'false'
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
