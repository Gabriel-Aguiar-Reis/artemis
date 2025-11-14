import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { Link, Stack } from 'expo-router'
import { MessageCircle, Plus } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import * as React from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WorkOrdersScreen() {
  const { data: workOrders, isLoading } = workOrderHooks.getWorkOrders()
  const { colorScheme } = useColorScheme()

  const sendWhatsApp = (workOrder: WorkOrder) => {
    try {
      // WhatsAppService.sendWorkOrderMessage(workOrder)
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando ordens de serviço...</Text>
      </SafeAreaView>
    )
  }

  if (!workOrders || workOrders.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4">
        <Stack.Screen
          options={{
            title: 'Ordens de Serviço',
            headerRight: () => (
              <Link href="/work-orders/form" asChild>
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
        <Text className="text-center text-muted-foreground">
          Nenhuma ordem de serviço cadastrada.
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Ordens de Serviço',
          headerRight: () => (
            <Link href="/work-orders/form" asChild>
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
          {workOrders.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-center text-muted-foreground">
                Nenhuma ordem de serviço cadastrada.
              </Text>
            </View>
          ) : (
            workOrders.map((wo) => (
              <View
                key={wo.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold">
                      {wo.customer.storeName}
                    </Text>
                    <Text className="mt-1 text-sm text-muted-foreground">
                      {wo.scheduledDate.toLocaleString('pt-BR')}
                    </Text>
                    <Text className="mt-2 text-sm">
                      Total: R$ {wo.totalAmount.toFixed(2)}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Produtos: {wo.products.length}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Pagamento: {wo.paymentOrder.method} -
                      {wo.paymentOrder.isPaid
                        ? ' Pago'
                        : ` ${wo.paymentOrder.paidInstallments}/${wo.paymentOrder.installments} parcelas`}
                    </Text>
                    {wo.visitDate && (
                      <Text className="mt-1 text-sm text-green-600">
                        ✓ Visitado em {wo.visitDate.toLocaleString('pt-BR')}
                      </Text>
                    )}
                  </View>
                  {wo.customer.isActiveWhatsApp() && (
                    <Pressable onPress={() => sendWhatsApp(wo)}>
                      <MessageCircle size={24} color="#25D366" />
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
