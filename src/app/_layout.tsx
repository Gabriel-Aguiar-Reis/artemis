import '@/global.css'
import 'react-native-get-random-values'

import { initDatabase } from '@/src/infra/db/drizzle/migrations'
import { NAV_THEME } from '@/src/lib/theme'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import * as React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - dados considerados frescos
      gcTime: 1000 * 60 * 10, // 10 minutos - tempo no cache
      retry: 1, // Tentar apenas 1 vez em caso de erro
      refetchOnWindowFocus: false, // Não refetch ao focar na janela
      refetchOnMount: false, // Não refetch ao montar se dados estiverem frescos
    },
  },
})

export default function RootLayout() {
  const { colorScheme } = useColorScheme()
  const [dbInitialized, setDbInitialized] = React.useState(false)

  React.useEffect(() => {
    initDatabase()
      .then(() => {
        console.log('Database initialized')
        setDbInitialized(true)
      })
      .catch((error) => {
        console.error('Failed to initialize database:', error)
      })
  }, [])

  if (!dbInitialized) {
    return null // Ou um componente de loading
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack>
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
          </Stack>
          <PortalHost />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
