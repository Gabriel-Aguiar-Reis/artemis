import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import {
  getPriorityStatus,
  paymentTone,
  reportTone,
  visitTone,
} from '@/src/components/ui/work-order-status'
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
import React from 'react'
import { View } from 'react-native'

const renderContactNumber = (customer: Customer) => {
  const value = customer.getMainNumber()
  if (!value) return null

  const phoneValue =
    value.type === 'smartphone'
      ? customer.phoneNumber?.value
      : customer.landlineNumber?.value

  if (!phoneValue) return null

  return (
    <Text className="ml-1 text-xs text-muted-foreground">
      {formatPhoneBrazil(phoneValue)}
    </Text>
  )
}

interface ReorderWorkOrderCardProps {
  wo: WorkOrder
  isLate?: boolean
}

function ReorderWorkOrderCardComponent({
  wo,
  isLate = false,
}: ReorderWorkOrderCardProps) {
  const priorityStatus = getPriorityStatus(wo, isLate)

  return (
    <View
      className={cn(
        'bg-card border border-border rounded-lg p-4 mb-4',
        priorityStatus?.borderClass
      )}
    >
      {/* Header */}
      <View className="mb-3">
        <View className="flex-row items-center gap-2 mb-2">
          <Icon as={Store} size={20} className="text-muted-foreground" />
          <View className="flex-1">
            <Text className="text-lg font-semibold" numberOfLines={2}>
              {wo.customer.storeName}
            </Text>
          </View>
          {priorityStatus && (
            <View
              className={`${priorityStatus.badgeClass} rounded-full px-2 py-0.5`}
            >
              <Text className={priorityStatus.textClass}>
                {priorityStatus.label}
              </Text>
            </View>
          )}
        </View>

        {/* Contact Info */}
        <View className="ml-6 gap-1">
          <View className="flex-row items-center">
            <Icon
              as={Contact}
              size={16}
              className="text-muted-foreground mr-1"
            />
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {wo.customer.contactName}
            </Text>
            {renderContactNumber(wo.customer)}
          </View>

          <View className="flex-row items-center">
            <Icon
              as={MapPinned}
              size={16}
              className="text-muted-foreground mr-1"
            />
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              CEP: {wo.customer.storeAddress.zipCode}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View className="h-[1px] bg-border mb-2" />

      {/* Dates */}
      <View className="flex-row items-center gap-3 mb-2">
        <View className="flex-row items-center gap-1">
          <Icon as={CalendarSync} size={16} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">
            {wo.scheduledDate.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
            })}
          </Text>
        </View>

        {wo.visitDate ? (
          <View className="flex-row items-center gap-1">
            <Icon as={CalendarCheck} size={16} className={visitTone(wo)} />
            <Text className={cn('text-sm', visitTone(wo))}>
              {wo.visitDate.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1">
            <Icon as={CalendarCheck} size={16} className={visitTone(wo)} />
            <Text className={cn('text-sm', visitTone(wo))}>Não visitado</Text>
          </View>
        )}
      </View>

      {/* Status Info */}
      <View className="flex-row items-center gap-3 flex-wrap">
        <View className="flex-row items-center gap-1">
          <Icon as={ReceiptText} size={16} className={reportTone(wo)} />
          <Text className={cn('text-sm', reportTone(wo))}>
            {wo.result ? 'Relatório' : 'Sem relatório'}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Icon as={Receipt} size={16} className={paymentTone(wo)} />
          <Text className={cn('text-sm', paymentTone(wo))} numberOfLines={1}>
            {wo.paymentOrder
              ? wo.paymentOrder.isPaid
                ? `${wo.paymentOrder.method} - Pago`
                : `${wo.paymentOrder.method} - ${wo.paymentOrder.paidInstallments}/${wo.paymentOrder.installments}`
              : 'Sem pagamento'}
          </Text>
        </View>
      </View>

      {wo.paymentOrder && (
        <View className="flex-row items-center mt-2">
          <Icon
            as={Banknote}
            size={16}
            className="text-muted-foreground mr-1"
          />
          <Text className="text-sm">
            R${' '}
            {wo.paymentOrder.totalValue.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>
      )}
    </View>
  )
}

export const ReorderWorkOrderCard = React.memo(
  ReorderWorkOrderCardComponent,
  (prevProps, nextProps) => {
    // Simple and efficient comparison
    if (prevProps.wo.id !== nextProps.wo.id) return false
    if (prevProps.isLate !== nextProps.isLate) return false
    if (prevProps.wo.status !== nextProps.wo.status) return false

    // If we got here, no re-render is needed
    return true
  }
)
