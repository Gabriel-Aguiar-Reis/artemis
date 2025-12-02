import { Icon } from '@/src/components/ui/icon'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Separator } from '@/src/components/ui/separator'
import { Text } from '@/src/components/ui/text'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/src/components/ui/tooltip'
import { WhatsAppIcon } from '@/src/components/ui/whatsapp-icon'
import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { cn, formatPhoneBrazil } from '@/src/lib/utils'
import {
  Banknote,
  CalendarCheck,
  CalendarSync,
  Contact,
  MapPinned,
  Receipt,
  ReceiptText,
  Store,
} from 'lucide-react-native'
import { View } from 'react-native'

const renderContactNumber = (customer: Customer) => {
  const base = (value: string) => (
    <View className="flex-row items-center gap-2">
      <View className="items-start text-primary">
        <View className="flex-row items-center">
          <Text className="ml-1 text-xs text-muted-foreground">
            {formatPhoneBrazil(value)}
          </Text>
        </View>
      </View>
    </View>
  )

  switch (customer.getMainNumber()?.type) {
    case 'smartphone':
      return base(customer.phoneNumber!.value)
    case 'landline':
      return base(customer.landlineNumber!.value)
    default:
      return null
  }
}

export function WorkOrderCard({
  wo,
  onPress,
}: {
  wo: WorkOrder
  onPress?: () => void
}) {
  return (
    <ObjectCard.Root key={wo.id} className="mb-4">
      <ObjectCard.Header>
        <ObjectCard.Title>
          <View className="flex-row items-center gap-2">
            <Icon as={Store} size={20} className="text-primary" />
            <Text className="text-lg font-semibold">
              {wo.customer.storeName}
            </Text>
          </View>
        </ObjectCard.Title>
        <ObjectCard.Description>
          <View className="ml-6 gap-1">
            <View className="flex-row items-center">
              <Icon
                as={Contact}
                size={16}
                className="text-muted-foreground mr-1"
              />
              <Text className="text-xs text-muted-foreground">
                {wo.customer.contactName}
              </Text>
              {renderContactNumber(wo.customer)}
              {wo.customer.isActiveWhatsApp() && (
                <WhatsAppIcon size={16} className="text-green-600 ml-1" />
              )}
            </View>
            <View className="flex-row items-center">
              <Icon
                as={MapPinned}
                size={16}
                className="text-muted-foreground mr-1"
              />
              <Text className="text-xs text-muted-foreground">
                {wo.customer.storeAddress.getFullAddress()}
              </Text>
            </View>
          </View>
        </ObjectCard.Description>
        {onPress && <ObjectCard.Actions onPress={onPress} />}
      </ObjectCard.Header>
      <ObjectCard.Content>
        <Separator className="mb-2" orientation="horizontal" />
        <View className="flex-row items-center gap-2">
          <Tooltip>
            <TooltipTrigger>
              <View className="flex-row items-center gap-2">
                <Icon
                  as={CalendarSync}
                  size={16}
                  className="text-muted-foreground"
                />
                <Text className="mt-1 text-sm text-muted-foreground">
                  {wo.scheduledDate.toLocaleString('pt-BR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'numeric',
                    year: '2-digit',
                  })}
                </Text>
              </View>
            </TooltipTrigger>
            <TooltipContent>
              <Text>Data agendada para visita</Text>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              {wo.visitDate ? (
                <View className="flex-row items-center gap-2">
                  <Icon
                    as={CalendarCheck}
                    size={16}
                    className="text-green-500 dark:text-green-300"
                  />

                  <Text className="mt-1 text-sm text-green-500 dark:text-green-300">
                    {wo.visitDate?.toLocaleString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'numeric',
                      year: '2-digit',
                    })}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Icon
                    as={CalendarCheck}
                    size={16}
                    className="text-orange-500 dark:text-orange-400"
                  />
                  <Text className="mt-1 text-sm text-orange-500 dark:text-orange-400">
                    Não visitado
                  </Text>
                </View>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <Text>Data da visita realizada</Text>
            </TooltipContent>
          </Tooltip>
        </View>

        <View className="flex-row items-center gap-2">
          <Tooltip>
            <TooltipTrigger>
              <View className="flex-row items-center mb-1 gap-2">
                <Icon
                  as={ReceiptText}
                  size={16}
                  className={cn(
                    'text-sm text-yellow-500 dark:text-yellow-200',
                    wo.result &&
                      'text-sm font-semibold text-cyan-500 dark:text-cyan-200'
                  )}
                />
                <Text
                  className={cn(
                    'text-sm text-yellow-500 dark:text-yellow-200',
                    wo.result &&
                      'text-sm font-semibold text-cyan-500 dark:text-cyan-200'
                  )}
                >
                  {wo.result ? 'Relatório registrado' : 'Não registrado'}
                </Text>
              </View>
            </TooltipTrigger>
            <TooltipContent>
              <Text>Relatório registrado na ordem de serviço</Text>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <View className="flex-row items-center mb-1 gap-2">
                <Icon
                  as={Receipt}
                  size={16}
                  className={cn(
                    'text-sm text-red-500 dark:text-red-200',
                    wo.paymentOrder?.isPaid &&
                      'text-sm font-semibold text-cyan-500 dark:text-cyan-200'
                  )}
                />
                <Text
                  className={cn(
                    'text-sm text-red-500 dark:text-red-200',
                    wo.paymentOrder?.isPaid &&
                      'text-sm font-semibold text-cyan-500 dark:text-cyan-200'
                  )}
                >
                  {wo.paymentOrder ? (
                    <>
                      {wo.paymentOrder.method} -{' '}
                      {wo.paymentOrder.isPaid
                        ? ' Pago'
                        : ` ${wo.paymentOrder.paidInstallments}/${wo.paymentOrder.installments} parcelas`}
                    </>
                  ) : (
                    'Não registrado'
                  )}
                </Text>
              </View>
            </TooltipTrigger>
            <TooltipContent>
              <Text>Pagamento registrado na ordem de serviço</Text>
            </TooltipContent>
          </Tooltip>
        </View>

        {wo.paymentOrder && (
          <Tooltip>
            <TooltipTrigger>
              <View className="flex-row items-center mb-1">
                <Icon as={Banknote} size={16} className="text-green-600" />
                <Text className="text-sm ml-1 ">
                  R${' '}
                  {wo.paymentOrder?.totalValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </TooltipTrigger>
            <TooltipContent>
              <Text>Total do valor dos produtos na ordem de serviço</Text>
            </TooltipContent>
          </Tooltip>
        )}
      </ObjectCard.Content>
    </ObjectCard.Root>
  )
}
