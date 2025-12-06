import '@/global.css'
import '@/src/components/ui/action-sheet'
import '@/src/components/ui/action-sheet/sheets'
import 'react-native-get-random-values'

import {
  useCreateInitialLicense,
  useLicense,
} from '@/src/application/hooks/license.hooks'
import { LicenseActivationDialog } from '@/src/components/ui/dialog/license-activation-dialog'
import { Text } from '@/src/components/ui/text'
import { toastConfig } from '@/src/components/ui/toasts'
import {
  getExpoDb,
  initDrizzleClient,
} from '@/src/infra/db/drizzle/drizzle-client'
import migrations from '@/src/infra/db/drizzle/migrations'
import { NAV_THEME } from '@/src/lib/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'
import * as NavigationBar from 'expo-navigation-bar'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import * as React from 'react'
import { Platform, View } from 'react-native'
import { SheetProvider } from 'react-native-actions-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export { ErrorBoundary } from 'expo-router'

const db = initDrizzleClient()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 segundos - permite refetch após invalidação
      gcTime: 1000 * 60 * 10, // 10 minutos - tempo no cache
      retry: 1, // Tentar apenas 1 vez em caso de erro
      refetchOnWindowFocus: false, // Não refetch ao focar na janela
      refetchOnMount: true, // IMPORTANTE: refetch ao montar se dados estiverem stale (invalidados)
      structuralSharing: false, // Desabilita structural sharing para garantir novos objetos
    },
  },
})

const THEME_STORAGE_KEY = 'user-theme-preference'

function LicenseCheck({ children }: { children: React.ReactNode }) {
  const { data: license, isLoading } = useLicense()
  const createLicenseMutation = useCreateInitialLicense()

  // Criar licença inicial se não existir
  React.useEffect(() => {
    if (!isLoading && !license) {
      createLicenseMutation.mutate()
    }
  }, [license, isLoading])

  // Mostrar dialog de ativação se licença expirou
  const shouldShowActivation =
    license && license.isExpired() && !license.isAdmin

  if (isLoading || createLicenseMutation.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Carregando...</Text>
      </View>
    )
  }

  return (
    <>
      {children}
      {shouldShowActivation && license && (
        <LicenseActivationDialog open={true} license={license} />
      )}
    </>
  )
}

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme()
  const { success, error } = useMigrations(db, migrations)

  useDrizzleStudio(getExpoDb())

  // Carregar preferência de tema salva
  React.useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((value: string | null) => {
      if (value === 'system') {
        setColorScheme(undefined as any)
      } else if (value === 'light' || value === 'dark') {
        setColorScheme(value)
      }
    })
  }, [setColorScheme])

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      const isDark = colorScheme === 'dark'
      NavigationBar.setBackgroundColorAsync(isDark ? '#0a0a0a' : '#ffffff')
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark')
    }
  }, [colorScheme])

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-red-600 font-bold text-lg mb-2">
          Erro de Migração
        </Text>
        <Text className="text-center">{error.message}</Text>
        <Text className="text-sm text-muted-foreground mt-4 text-center">
          Tente deletar o app e reinstalar
        </Text>
      </View>
    )
  }
  if (!success) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Configurando banco de dados...</Text>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <LicenseCheck>
            <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
              <SheetProvider context="global">
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <Stack
                  screenOptions={{
                    animation:
                      Platform.OS === 'ios'
                        ? 'ios_from_right'
                        : 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="index" options={{ title: 'Artemis' }} />
                  <Stack.Screen
                    name="categories/index"
                    options={{ title: 'Categorias' }}
                  />
                  <Stack.Screen
                    name="categories/form"
                    options={{ title: 'Nova Categoria' }}
                  />
                  <Stack.Screen
                    name="customers/index"
                    options={{ title: 'Clientes' }}
                  />
                  <Stack.Screen
                    name="customers/form"
                    options={{ title: 'Cadastrar Cliente' }}
                  />
                  <Stack.Screen
                    name="products/index"
                    options={{ title: 'Produtos' }}
                  />
                  <Stack.Screen
                    name="products/form"
                    options={{ title: 'Cadastrar Produto' }}
                  />
                  <Stack.Screen
                    name="work-orders/index"
                    options={{ title: 'Ordens de Serviço' }}
                  />
                  <Stack.Screen
                    name="work-orders/form"
                    options={{ title: 'Criar Ordem' }}
                  />
                  <Stack.Screen
                    name="itinerary/index"
                    options={{ title: 'Itinerário' }}
                  />
                  <Stack.Screen
                    name="admin/generate-license"
                    options={{ title: 'Gerar Código de Licença' }}
                  />
                  <Stack.Screen
                    name="license/renew"
                    options={{ title: 'Renovar Licença' }}
                  />
                </Stack>
                <PortalHost />
              </SheetProvider>
              <Toast config={toastConfig} visibilityTime={6000} />
            </ThemeProvider>
          </LicenseCheck>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
