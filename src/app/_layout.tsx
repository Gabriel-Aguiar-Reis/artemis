import '@/global.css'
import '@/src/components/ui/action-sheet'
import '@/src/components/ui/action-sheet/sheets'
import 'react-native-get-random-values'

import {
  useCreateInitialLicense,
  useLicense,
} from '@/src/application/hooks/license.hooks'
import { logError } from '@/src/application/services/error-logging.service'
import { Button } from '@/src/components/ui/button'
import { LicenseActivationDialog } from '@/src/components/ui/dialog/license-activation-dialog'
import { Text } from '@/src/components/ui/text'
import { toastConfig } from '@/src/components/ui/toasts'
import {
  enableForeignKeys,
  getExpoDb,
  initDrizzleClient,
  removeWalFiles,
} from '@/src/infra/db/drizzle/drizzle-client'
import migrations from '@/src/infra/db/drizzle/migrations'
import { NAV_THEME } from '@/src/lib/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import Constants from 'expo-constants'
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'
import * as NavigationBar from 'expo-navigation-bar'
import { ErrorBoundaryProps, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import { ReactNode, useEffect, useState } from 'react'
import { Platform, View } from 'react-native'
import { SheetProvider } from 'react-native-actions-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

// ErrorBoundary customizado que captura erros e os salva no banco
export function ErrorBoundary(props: ErrorBoundaryProps) {
  useEffect(() => {
    // Capturar erro e salvar no banco
    if (props.error) {
      logError('ErrorBoundary caught error', props.error, 'ErrorBoundary', {
        retry: props.retry,
      }).catch((err) => {
        console.error('Failed to log error in ErrorBoundary:', err)
      })
    }
  }, [props.error])

  // Delegar para o ErrorBoundary padrão do expo-router
  const { ErrorBoundary: ExpoErrorBoundary } = require('expo-router')
  return <ExpoErrorBoundary {...props} />
}

// Segura a splash nativa até migrations, FK, licença e tema estarem prontos
SplashScreen.preventAutoHideAsync().catch(() => {})

const hideSplash = () => {
  SplashScreen.hideAsync().catch(() => {})
}

/** Abre o Drizzle Studio apenas em desenvolvimento. */
function DevDrizzleStudio() {
  useDrizzleStudio(getExpoDb())
  return null
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 segundos - dados cadastrais sobrescrevem para 5min nos hooks
      gcTime: 1000 * 60 * 10, // 10 minutos - tempo no cache
      retry: 1, // Tentar apenas 1 vez em caso de erro
      refetchOnWindowFocus: false, // Não refetch ao focar na janela
      refetchOnMount: true, // IMPORTANTE: refetch ao montar se dados estiverem stale (invalidados)
    },
  },
})

queryClient.setDefaultOptions({
  queries: {
    retry: 1,
  },
  mutations: {
    onError: (error) => {
      // Capturar erros de mutations
      logError('Mutation error', error, 'TanStack Query').catch((err) => {
        console.error('Failed to log mutation error:', err)
      })
    },
  },
})

const THEME_STORAGE_KEY = 'user-theme-preference'

function LicenseCheck({
  children,
  themeReady,
}: {
  children: ReactNode
  themeReady: boolean
}) {
  const { data: license, isLoading } = useLicense()
  const createLicenseMutation = useCreateInitialLicense()

  // Criar licença inicial se não existir
  useEffect(() => {
    if (!isLoading && !license) {
      createLicenseMutation.mutate()
    }
  }, [license, isLoading])

  // Mostrar dialog de ativação se licença expirou
  const shouldShowActivation =
    license && license.isExpired() && !license.isAdmin

  // No primeiro uso não há licença: no primeiro commit isPending ainda é false
  // (o mutate roda no efeito), então espera a licença existir ou a criação
  // terminar (sucesso ou erro) para não piscar uma tela em branco.
  const licenseReady =
    !isLoading &&
    !createLicenseMutation.isPending &&
    (!!license ||
      createLicenseMutation.isSuccess ||
      createLicenseMutation.isError)

  // Esconde a splash quando licença e tema estão prontos
  useEffect(() => {
    if (licenseReady && themeReady) hideSplash()
  }, [licenseReady, themeReady])

  if (!licenseReady) return null

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
  const [db, setDb] = useState(() => initDrizzleClient())
  const { success, error } = useMigrations(db, migrations)
  const [migrationsComplete, setMigrationsComplete] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [themeReady, setThemeReady] = useState(false)

  const handleResetDatabase = async () => {
    setIsResetting(true)

    try {
      // Fechar conexão e resetar instâncias
      const { resetDrizzleClient } =
        await import('@/src/infra/db/drizzle/drizzle-client')
      resetDrizzleClient()

      // Aguardar para garantir que conexão foi fechada
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Deletar o banco
      const { deleteDatabaseSync } = require('expo-sqlite')
      await deleteDatabaseSync('artemis.db')
      await removeWalFiles()
      if (__DEV__) console.log('Database deleted, reloading app...')

      // Recarregar o app completamente
      const { reloadAsync } = require('expo-updates')
      await reloadAsync()
    } catch (error) {
      console.error('Error resetting database:', error)
      setIsResetting(false)

      // Se falhar, tentar apenas recarregar o app
      try {
        const { reloadAsync } = require('expo-updates')
        await reloadAsync()
      } catch (reloadError) {
        console.error('Error reloading app:', reloadError)
      }
    }
  }

  // Log de debug para migrations (apenas em desenvolvimento)
  useEffect(() => {
    if (!__DEV__) return
    if (error) {
      console.error('Migration error:', error)
      console.error(
        'Migrations count:',
        Object.keys(migrations?.migrations || {}).length
      )
    }
  }, [error])

  // Erro de migração: mostra a tela de erro, então libera a splash
  useEffect(() => {
    if (error) hideSplash()
  }, [error])

  // Habilitar foreign keys APÓS migrations serem concluídas
  useEffect(() => {
    if (success && !migrationsComplete) {
      try {
        enableForeignKeys()
        setMigrationsComplete(true)

        // Limpar logs antigos (>7 dias) após migrations
        const {
          cleanupOldLogs,
        } = require('@/src/application/services/error-logging.service')
        cleanupOldLogs(7).catch((err: Error) => {
          console.error('Failed to cleanup old logs:', err)
        })
      } catch (err) {
        console.error('Error enabling foreign keys:', err)
        hideSplash()
      }
    }
  }, [success, migrationsComplete])

  // Carregar preferência de tema salva
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((value: string | null) => {
        if (value === 'system') {
          setColorScheme(undefined as any)
        } else if (value === 'light' || value === 'dark') {
          setColorScheme(value)
        }
      })
      .catch(() => {})
      .finally(() => setThemeReady(true))
  }, [setColorScheme])

  useEffect(() => {
    if (Platform.OS === 'android') {
      const isDark = colorScheme === 'dark'
      NavigationBar.setBackgroundColorAsync(isDark ? '#0a0a0a' : '#ffffff')
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark')
    }
  }, [colorScheme])

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4 bg-background">
        <Text className="text-red-600 font-bold text-lg mb-2 text-center">
          Erro de Migração do Banco de Dados
        </Text>
        <Text className="text-center mb-4 text-muted-foreground">
          O banco de dados está corrompido e precisa ser resetado.
        </Text>

        <View className="gap-3 w-full max-w-sm">
          <Button
            onPress={handleResetDatabase}
            disabled={isResetting}
            variant="destructive"
            className="w-full"
          >
            <Text className="text-destructive-foreground">
              {isResetting ? 'Resetando...' : 'Resetar e Recarregar App'}
            </Text>
          </Button>

          <View className="gap-2 p-4 bg-muted rounded-lg">
            <Text className="text-xs font-medium">⚠️ Instruções:</Text>
            <Text className="text-xs text-muted-foreground">
              1. Clique no botão acima para tentar resetar
            </Text>
            <Text className="text-xs text-muted-foreground">
              2. Se não funcionar, vá em Configurações do Android → Apps →
              {Constants.expoConfig?.name ?? 'Artemis'}
            </Text>
            <Text className="text-xs text-muted-foreground">
              3. Clique em "Armazenamento" e depois "Limpar dados"
            </Text>
            <Text className="text-xs text-muted-foreground">
              4. Abra o app novamente
            </Text>
          </View>
        </View>
      </View>
    )
  }
  // Splash nativa continua visível enquanto o banco inicializa
  if (!success || !migrationsComplete) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {__DEV__ && <DevDrizzleStudio />}
          <LicenseCheck themeReady={themeReady}>
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
                  <Stack.Screen
                    name="index"
                    options={{ title: Constants.expoConfig?.name ?? 'Artemis' }}
                  />
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
                    name="admin/data-dump"
                    options={{ title: 'Exportar Dados' }}
                  />
                  <Stack.Screen
                    name="admin/logs-viewer"
                    options={{ title: 'Logs do Sistema' }}
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
