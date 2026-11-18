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
import { loadLastTab } from '@/src/lib/last-tab'
import { NAV_THEME, THEME } from '@/src/lib/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
// reloadAppAsync ships with expo (expo-updates is not a dependency: the old
// require('expo-updates') made the reset button fail at runtime)
import { reloadAppAsync } from 'expo'
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

// Custom ErrorBoundary that captures errors and saves them to the database
export function ErrorBoundary(props: ErrorBoundaryProps) {
  useEffect(() => {
    // Capture the error and save it to the database
    if (props.error) {
      logError('ErrorBoundary caught error', props.error, 'ErrorBoundary', {
        retry: props.retry,
      }).catch((err) => {
        console.error('Failed to log error in ErrorBoundary:', err)
      })
    }
  }, [props.error])

  // Delegate to the default expo-router ErrorBoundary
  const { ErrorBoundary: ExpoErrorBoundary } = require('expo-router')
  return <ExpoErrorBoundary {...props} />
}

// Hold the native splash until migrations, FK, license and theme are ready
SplashScreen.preventAutoHideAsync().catch(() => {})

const hideSplash = () => {
  SplashScreen.hideAsync().catch(() => {})
}

/** Opens Drizzle Studio in development only. */
function DevDrizzleStudio() {
  useDrizzleStudio(getExpoDb())
  return null
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds - master data overrides this to 5min in the hooks
      gcTime: 1000 * 60 * 10, // 10 minutos - tempo no cache
      retry: 1, // Retry only once on error
      refetchOnWindowFocus: false, // Do not refetch on window focus
      refetchOnMount: true, // IMPORTANT: refetch on mount if data is stale (invalidated)
    },
  },
})

queryClient.setDefaultOptions({
  queries: {
    retry: 1,
  },
  mutations: {
    onError: (error) => {
      // Capture mutation errors
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

  // Create the initial license if it does not exist
  useEffect(() => {
    if (!isLoading && !license) {
      createLicenseMutation.mutate()
    }
  }, [license, isLoading])

  // Show the activation dialog if the license expired
  const shouldShowActivation =
    license && license.isExpired() && !license.isAdmin

  // On first use there is no license: on the first commit isPending is still false
  // (the mutate runs in the effect), so wait for the license to exist or for the creation
  // to finish (success or error) to avoid flashing a blank screen.
  const licenseReady =
    !isLoading &&
    !createLicenseMutation.isPending &&
    (!!license ||
      createLicenseMutation.isSuccess ||
      createLicenseMutation.isError)

  // Hide the splash when license and theme are ready
  useEffect(() => {
    if (licenseReady && themeReady) hideSplash()
  }, [licenseReady, themeReady])

  // Also wait for the stored theme/last tab/filters: the initial redirect
  // (index → last tab) reads them synchronously
  if (!licenseReady || !themeReady) return null

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
  const [fkError, setFkError] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [themeReady, setThemeReady] = useState(false)

  const handleResetDatabase = async () => {
    setIsResetting(true)

    try {
      // Close the connection and reset instances
      const { resetDrizzleClient } =
        await import('@/src/infra/db/drizzle/drizzle-client')
      resetDrizzleClient()

      // Wait to make sure the connection was closed
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Delete the database
      const { deleteDatabaseSync } = require('expo-sqlite')
      await deleteDatabaseSync('artemis.db')
      await removeWalFiles()
      if (__DEV__) console.log('Database deleted, reloading app...')

      // Fully reload the app
      await reloadAppAsync()
    } catch (error) {
      console.error('Error resetting database:', error)
      setIsResetting(false)

      // If it fails, just try reloading the app
      try {
        await reloadAppAsync()
      } catch (reloadError) {
        console.error('Error reloading app:', reloadError)
      }
    }
  }

  // Debug log for migrations (development only)
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

  // Migration error: show the error screen, then release the splash
  useEffect(() => {
    if (error) hideSplash()
  }, [error])

  // Enable foreign keys AFTER migrations complete
  useEffect(() => {
    if (success && !migrationsComplete) {
      try {
        if (!enableForeignKeys()) {
          setFkError(true)
          hideSplash()
          return
        }
        setMigrationsComplete(true)

        // Clear old logs (>7 days) after migrations
        const {
          cleanupOldLogs,
        } = require('@/src/application/services/error-logging.service')
        cleanupOldLogs(7).catch((err: Error) => {
          console.error('Failed to cleanup old logs:', err)
        })
      } catch (err) {
        console.error('Error enabling foreign keys:', err)
        setFkError(true)
        hideSplash()
      }
    }
  }, [success, migrationsComplete])

  // Load the saved theme preference
  useEffect(() => {
    // Theme and last tab are read before the splash hides, so the initial
    // redirect (index → last tab) is synchronous and there's no theme flash
    const theme = AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((value: string | null) => {
        if (value === 'system') {
          setColorScheme(undefined as any)
        } else if (value === 'light' || value === 'dark') {
          setColorScheme(value)
        }
      })
      .catch(() => {})
    Promise.all([theme, loadLastTab()]).finally(() => setThemeReady(true))
  }, [setColorScheme])

  useEffect(() => {
    if (Platform.OS === 'android') {
      const isDark = colorScheme === 'dark'
      NavigationBar.setBackgroundColorAsync(
        isDark ? THEME.dark.background : THEME.light.background
      )
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark')
    }
  }, [colorScheme])

  // Database opened but could not be configured: data is intact, so offer a
  // retry instead of the destructive reset used for migration errors
  if (fkError) {
    return (
      <View className="flex-1 items-center justify-center p-4 bg-background gap-3">
        <Text className="text-destructive font-bold text-lg text-center">
          Não foi possível abrir o banco de dados
        </Text>
        <Text className="text-center text-muted-foreground">
          Seus dados não foram apagados. Tente abrir o app novamente.
        </Text>
        <Button
          className="w-full max-w-sm"
          onPress={() => {
            reloadAppAsync().catch(() => {})
          }}
        >
          <Text>Tentar novamente</Text>
        </Button>
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4 bg-background">
        <Text className="text-destructive font-bold text-lg mb-2 text-center">
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
  // Native splash stays visible while the database initializes
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
                  // Root stack: the tabs plus every form, which opens above the
                  // tab bar
                  screenOptions={{
                    animation:
                      Platform.OS === 'ios'
                        ? 'ios_from_right'
                        : 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="categories/form"
                    options={{ title: 'Nova Categoria' }}
                  />
                  <Stack.Screen
                    name="customers/form"
                    options={{ title: 'Cadastrar Cliente' }}
                  />
                  <Stack.Screen
                    name="products/form"
                    options={{ title: 'Cadastrar Produto' }}
                  />
                  <Stack.Screen
                    name="work-orders/form"
                    options={{ title: 'Criar Ordem' }}
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
