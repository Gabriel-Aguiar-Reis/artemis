import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Button } from '@/src/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card'
import { Icon } from '@/src/components/ui/icon'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Text } from '@/src/components/ui/text'
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import { UUID } from '@/src/lib/utils'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  MapPin,
  Package,
  Receipt,
  ReceiptText,
  User,
  XCircle,
} from 'lucide-react-native'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WorkOrderDetailsScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()

  const { data: workOrder, isLoading } = workOrderHooks.getWorkOrder(params.id)

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando ordem de serviço...</Text>
      </SafeAreaView>
    )
  }

  if (!workOrder) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Ordem de serviço não encontrada.</Text>
      </SafeAreaView>
    )
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusLabel = (status: WorkOrderStatus) => {
    const labels: Record<WorkOrderStatus, string> = {
      [WorkOrderStatus.PENDING]: 'Pendente',
      [WorkOrderStatus.COMMITTED]: 'Comprometida',
      [WorkOrderStatus.IN_PROGRESS]: 'Em Progresso',
      [WorkOrderStatus.COMPLETED]: 'Concluída',
      [WorkOrderStatus.PARTIAL]: 'Parcial',
      [WorkOrderStatus.FAILED]: 'Falha',
      [WorkOrderStatus.CANCELLED]: 'Cancelada',
      [WorkOrderStatus.EXPIRED]: 'Expirada',
      [WorkOrderStatus.COPIED]: 'Copiada',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: WorkOrderStatus) => {
    const colors: Record<WorkOrderStatus, string> = {
      [WorkOrderStatus.PENDING]: 'text-yellow-500',
      [WorkOrderStatus.COMMITTED]: 'text-blue-500',
      [WorkOrderStatus.IN_PROGRESS]: 'text-cyan-500',
      [WorkOrderStatus.COMPLETED]: 'text-green-500',
      [WorkOrderStatus.PARTIAL]: 'text-orange-500',
      [WorkOrderStatus.FAILED]: 'text-red-500',
      [WorkOrderStatus.CANCELLED]: 'text-gray-500',
      [WorkOrderStatus.EXPIRED]: 'text-orange-600',
      [WorkOrderStatus.COPIED]: 'text-cyan-600',
    }
    return colors[status] || 'text-muted-foreground'
  }

  const canEdit =
    workOrder.status !== WorkOrderStatus.EXPIRED &&
    workOrder.status !== WorkOrderStatus.COPIED
  const canCreateResult =
    !workOrder.result &&
    workOrder.status !== WorkOrderStatus.EXPIRED &&
    workOrder.status !== WorkOrderStatus.COPIED
  const canCreatePayment =
    workOrder.result &&
    !workOrder.paymentOrder &&
    workOrder.status !== WorkOrderStatus.EXPIRED &&
    workOrder.status !== WorkOrderStatus.COPIED
  const canClone =
    (workOrder.result && workOrder.paymentOrder) ||
    workOrder.status === WorkOrderStatus.EXPIRED

  const productsCount = workOrder.products?.length || 0

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Detalhes da Ordem',
        }}
      />
      <ScrollView className="flex-1 p-4">
        {/* Informações Gerais */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-3">
              {/* Cliente */}
              <View className="flex-row items-center gap-2">
                <Icon as={User} className="text-muted-foreground" size={20} />
                <Text className="text-sm text-muted-foreground flex-1">
                  Cliente
                </Text>
                <Text className="text-sm font-semibold">
                  {workOrder.customer.storeName}
                </Text>
              </View>

              {/* Data Agendada */}
              <View className="flex-row items-center gap-2">
                <Icon
                  as={Calendar}
                  className="text-muted-foreground"
                  size={20}
                />
                <Text className="text-sm text-muted-foreground flex-1">
                  Data Agendada
                </Text>
                <Text className="text-sm font-semibold">
                  {formatDate(workOrder.scheduledDate)}
                </Text>
              </View>

              {/* Data de Visita */}
              {workOrder.visitDate && (
                <View className="flex-row items-center gap-2">
                  <Icon
                    as={MapPin}
                    className="text-muted-foreground"
                    size={20}
                  />
                  <Text className="text-sm text-muted-foreground flex-1">
                    Data da Visita
                  </Text>
                  <Text className="text-sm font-semibold">
                    {formatDate(workOrder.visitDate)}
                  </Text>
                </View>
              )}

              {/* Status */}
              <View className="flex-row items-center gap-2">
                <Icon as={Clock} className="text-muted-foreground" size={20} />
                <Text className="text-sm text-muted-foreground flex-1">
                  Status
                </Text>
                <Text
                  className={`text-sm font-semibold ${getStatusColor(workOrder.status)}`}
                >
                  {getStatusLabel(workOrder.status)}
                </Text>
              </View>

              {/* Observações */}
              {workOrder.notes && (
                <View className="flex-col gap-1 mt-2">
                  <Text className="text-sm text-muted-foreground">
                    Observações
                  </Text>
                  <Text className="text-sm">{workOrder.notes}</Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Produtos Agendados */}
        <ObjectCard.Root className="mb-4 dark:bg-input/30">
          <ObjectCard.Header>
            <View className="flex-row items-center gap-2 flex-1">
              <Icon as={Package} className="text-primary" size={20} />
              <ObjectCard.Title>Produtos Agendados</ObjectCard.Title>
            </View>
          </ObjectCard.Header>
          <ObjectCard.Content>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-muted-foreground flex-1">
                  Total de Produtos
                </Text>
                <Text className="text-sm font-semibold">{productsCount}</Text>
              </View>
              <Button
                variant="outline"
                onPress={() =>
                  router.push(`/work-orders/${workOrder.id}/products`)
                }
              >
                <Text>Ver Produtos</Text>
              </Button>
            </View>
          </ObjectCard.Content>
        </ObjectCard.Root>

        {/* Relatório */}
        <ObjectCard.Root className="mb-4 dark:bg-input/30">
          <ObjectCard.Header>
            <View className="flex-row items-center gap-2 flex-1">
              <Icon
                as={ReceiptText}
                className={
                  workOrder.result ? 'text-cyan-500' : 'text-yellow-500'
                }
                size={20}
              />
              <ObjectCard.Title>Relatório</ObjectCard.Title>
            </View>
          </ObjectCard.Header>
          <ObjectCard.Content>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Icon
                  as={workOrder.result ? CheckCircle2 : XCircle}
                  className={
                    workOrder.result ? 'text-cyan-500' : 'text-yellow-500'
                  }
                  size={16}
                />
                <Text className="text-sm text-muted-foreground flex-1">
                  {workOrder.result ? 'Registrado' : 'Não Registrado'}
                </Text>
                {workOrder.result && (
                  <Text className="text-sm font-semibold">
                    R${' '}
                    {workOrder.result.totalValue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                )}
              </View>
              {workOrder.result ? (
                <Button
                  variant="outline"
                  onPress={() =>
                    router.push(`/work-orders/${workOrder.id}/result`)
                  }
                >
                  <Text>Ver Relatório</Text>
                </Button>
              ) : (
                canCreateResult && (
                  <Button
                    variant="default"
                    onPress={() =>
                      router.push(`/work-orders/${workOrder.id}/result/create`)
                    }
                  >
                    <Text>Criar Relatório</Text>
                  </Button>
                )
              )}
            </View>
          </ObjectCard.Content>
        </ObjectCard.Root>

        {/* Pagamento */}
        <ObjectCard.Root className="mb-4 dark:bg-input/30">
          <ObjectCard.Header>
            <View className="flex-row items-center gap-2 flex-1">
              <Icon
                as={Receipt}
                className={
                  workOrder.paymentOrder
                    ? workOrder.paymentOrder.isPaid
                      ? 'text-green-500'
                      : 'text-orange-500'
                    : 'text-red-500'
                }
                size={20}
              />
              <ObjectCard.Title>Pagamento</ObjectCard.Title>
            </View>
          </ObjectCard.Header>
          <ObjectCard.Content>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Icon
                  as={workOrder.paymentOrder ? CheckCircle2 : XCircle}
                  className={
                    workOrder.paymentOrder ? 'text-green-500' : 'text-red-500'
                  }
                  size={16}
                />
                <Text className="text-sm text-muted-foreground flex-1">
                  {workOrder.paymentOrder
                    ? workOrder.paymentOrder.isPaid
                      ? 'Pago'
                      : 'Pendente'
                    : 'Não Registrado'}
                </Text>
                {workOrder.paymentOrder && (
                  <Text className="text-sm font-semibold">
                    R${' '}
                    {workOrder.paymentOrder.totalValue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                )}
              </View>
              {workOrder.paymentOrder ? (
                <Button
                  variant="outline"
                  onPress={() =>
                    router.push(`/work-orders/${workOrder.id}/payment`)
                  }
                >
                  <Text>Ver Pagamento</Text>
                </Button>
              ) : (
                canCreatePayment && (
                  <Button
                    variant="default"
                    onPress={() =>
                      router.push(`/work-orders/${workOrder.id}/payment/create`)
                    }
                  >
                    <Text>Criar Pagamento</Text>
                  </Button>
                )
              )}
            </View>
          </ObjectCard.Content>
        </ObjectCard.Root>

        {/* Ações */}
        <View className="gap-3">
          {canEdit && (
            <Button
              variant="outline"
              onPress={() => router.push(`/work-orders/${workOrder.id}/edit`)}
            >
              <Icon as={Edit} size={20} className="text-foreground mr-2" />
              <Text>Editar Ordem</Text>
            </Button>
          )}
          {canClone && (
            <Button
              variant="outline"
              onPress={() => router.push(`/work-orders/${workOrder.id}/clone`)}
            >
              <Icon as={Copy} size={20} className="text-foreground mr-2" />
              <Text>Clonar Ordem</Text>
            </Button>
          )}
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  )
}
