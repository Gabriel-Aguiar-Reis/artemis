import '@/global.css'
import '@/src/components/ui/action-sheet'
import '@/src/components/ui/action-sheet/sheets'
import 'react-native-get-random-values'

import {
  useCreateInitialLicense,
  useLicense,
} from '@/src/application/hooks/license.hooks'
import { Button } from '@/src/components/ui/button'
import { LicenseActivationDialog } from '@/src/components/ui/dialog/license-activation-dialog'
import { Text } from '@/src/components/ui/text'
import { toastConfig } from '@/src/components/ui/toasts'
import {
  enableForeignKeys,
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
import { ReactNode, useEffect, useState } from 'react'
import { Platform, View } from 'react-native'
import { SheetProvider } from 'react-native-actions-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export { ErrorBoundary } from 'expo-router'

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

function LicenseCheck({ children }: { children: ReactNode }) {
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
  const [db, setDb] = useState(() => initDrizzleClient())
  const { success, error } = useMigrations(db, migrations)
  const [migrationsComplete, setMigrationsComplete] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

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
      console.log('Database deleted, reloading app...')

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

  // Log de debug para migrations
  useEffect(() => {
    if (error) {
      console.error('Migration error:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      console.error('Error details:', JSON.stringify(error, null, 2))

      // Verificar se migrations foram carregadas
      console.log('Migrations object:', migrations)
      console.log('Migrations journal:', migrations?.journal)
      console.log(
        'Migrations count:',
        Object.keys(migrations?.migrations || {}).length
      )
    }
    if (success) {
      console.log('Migrations completed successfully')
    }
  }, [success, error])

  // Habilitar foreign keys APÓS migrations serem concluídas
  useEffect(() => {
    if (success && !migrationsComplete) {
      try {
        enableForeignKeys()
        setMigrationsComplete(true)
        console.log('Foreign keys enabled successfully')
      } catch (err) {
        console.error('Error enabling foreign keys:', err)
      }
    }
  }, [success, migrationsComplete])

  useDrizzleStudio(getExpoDb())

  // Carregar preferência de tema salva
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((value: string | null) => {
      if (value === 'system') {
        setColorScheme(undefined as any)
      } else if (value === 'light' || value === 'dark') {
        setColorScheme(value)
      }
    })
  }, [setColorScheme])

  useEffect(() => {
    if (Platform.OS === 'android') {
      const isDark = colorScheme === 'dark'
      NavigationBar.setBackgroundColorAsync(isDark ? '#0a0a0a' : '#ffffff')
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark')
    }
  }, [colorScheme])

  if (error) {
    console.error('Rendering migration error screen')
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
              Artemis
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
  if (!success || !migrationsComplete) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg mb-2">Configurando banco de dados...</Text>
        <Text className="text-sm text-muted-foreground">
          Aguarde enquanto inicializamos o sistema
        </Text>
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
                    name="admin/data-dump"
                    options={{ title: 'Exportar Dados' }}
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
