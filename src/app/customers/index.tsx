import { customerHooks } from '@/src/application/hooks/customer.hooks'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { Link, Stack } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CustomersScreen() {
  const { colorScheme } = useColorScheme()
  const { data: customers, isLoading } = customerHooks.getCustomers()

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando clientes...</Text>
      </SafeAreaView>
    )
  }

  if (!customers || customers.length === 0) {
    return (
      <SafeAreaView className="flex-1">
        <Stack.Screen
          options={{
            title: 'Clientes',
            headerRight: () => (
              <Link href="/customers/form" asChild>
                <Button size="icon" variant="outline">
                  <Plus
                    size={24}
                    color={colorScheme === 'dark' ? 'white' : undefined}
                  />
                </Button>
              </Link>
            ),
          }}
        />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            Nenhum cliente cadastrado.{'\n'}
            Clique no + para adicionar.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Clientes',
          headerRight: () => (
            <Link href="/customers/form" asChild>
              <Button size="icon" variant="outline">
                <Plus
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : undefined}
                />
              </Button>
            </Link>
          ),
        }}
      />
      <ScrollView className="flex-1">
        <View className="gap-3 p-4">
          {customers.map((customer) => (
            <View
              key={customer.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <Text className="text-lg font-semibold">
                {customer.storeName}
              </Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                {customer.contactName}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {customer.phoneNumber.value}
                {customer.phoneNumber.isWhatsApp && ' (WhatsApp)'}
              </Text>
              <Text className="mt-2 text-sm text-muted-foreground">
                {customer.storeAddress.streetName},{' '}
                {customer.storeAddress.streetNumber}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {customer.storeAddress.neighborhood} -{' '}
                {customer.storeAddress.city}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
