import { Icon } from '@/src/components/ui/icon'
import { ObjectCard } from '@/src/components/ui/object-card'
import { Separator } from '@/src/components/ui/separator'
import { Text } from '@/src/components/ui/text'
import { WhatsAppIcon } from '@/src/components/ui/whatsapp-icon'
import {
  getPriorityStatus,
  paymentTone,
  reportTone,
  visitTone,
} from '@/src/components/ui/work-order-status'
import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { formatBRL, formatDateShort } from '@/src/lib/format'
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
  const base = (value: string) => (
    <View className="flex-row items-center gap-2">
      <View className="items-start">
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

function WorkOrderCardComponent({
  wo,
  onPress,
  onOptions,
  isLate = false,
}: {
  wo: WorkOrder
  onPress?: () => void
  /** Prefer this one: a stable callback receives the work order (enables memoization) */
  onOptions?: (wo: WorkOrder) => void
  isLate?: boolean
}) {
  // Priority order: CLONADA > S/ PGTO > EXPIRADA > ATRASADO
  const priorityStatus = getPriorityStatus(wo, isLate)

  return (
    <ObjectCard.Root className={cn('mb-4', priorityStatus?.borderClass)}>
      <ObjectCard.Header>
        <ObjectCard.Title>
          <View className="flex-row items-center gap-2">
            <Icon as={Store} size={20} className="text-muted-foreground" />
            <View className="flex-1">
              <Text
                className="text-lg font-semibold"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
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
        </ObjectCard.Title>
        <ObjectCard.Description>
          <View className="ml-6 gap-1 max-w-full">
            <View className="flex-row items-center">
              <Icon
                as={Contact}
                size={16}
                className="text-muted-foreground mr-1"
              />
              <View className="flex-wrap flex-row items-center max-w-60">
                <Text
                  className="text-xs text-muted-foreground"
                  numberOfLines={2}
                >
                  {wo.customer.contactName}
                </Text>
                {renderContactNumber(wo.customer)}
              </View>
              {wo.customer.isActiveWhatsApp() && (
                <WhatsAppIcon size={16} className="text-success ml-1" />
              )}
            </View>
            <View className="flex-row items-center">
              <Icon
                as={MapPinned}
                size={16}
                className="text-muted-foreground mr-1"
              />
              <View className="flex-row items-center flex-wrap">
                <Text
                  className="text-xs text-muted-foreground"
                  numberOfLines={2}
                >
                  {wo.customer.storeAddress.getFullAddress()}
                </Text>
              </View>
            </View>
          </View>
        </ObjectCard.Description>
        {(onOptions || onPress) && (
          <ObjectCard.Actions
            onPress={onOptions ? () => onOptions(wo) : onPress!}
          />
        )}
      </ObjectCard.Header>
      <ObjectCard.Content>
        <Separator className="mb-2" orientation="horizontal" />
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-2">
            <Icon
              as={CalendarSync}
              size={16}
              className="text-muted-foreground"
            />
            <Text className="mt-1 text-sm text-muted-foreground">
              {formatDateShort(wo.scheduledDate)}
            </Text>
          </View>

          {wo.visitDate ? (
            <View className="flex-row items-center gap-2">
              <Icon as={CalendarCheck} size={16} className={visitTone(wo)} />

              <Text className={cn('mt-1 text-sm', visitTone(wo))}>
                {formatDateShort(wo.visitDate)}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <Icon as={CalendarCheck} size={16} className={visitTone(wo)} />
              <Text className={cn('mt-1 text-sm', visitTone(wo))}>
                Não visitado
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2 flex-wrap">
          <View className="flex-row items-center mb-1 gap-2">
            <Icon
              as={ReceiptText}
              size={16}
              className={cn('text-sm', reportTone(wo))}
            />
            <Text className={cn('text-sm', reportTone(wo))}>
              {wo.result ? 'Relatório registrado' : 'Não registrado'}
            </Text>
          </View>

          <View className="flex-row items-center mb-1 gap-2 flex-wrap">
            <Icon
              as={Receipt}
              size={16}
              className={cn('text-sm', paymentTone(wo))}
            />
            <Text className={cn('text-sm', paymentTone(wo))}>
              {wo.paymentOrder ? (
                <>
                  {wo.paymentOrder.method} -
                  {wo.paymentOrder.isPaid
                    ? ' Pago'
                    : ` ${wo.paymentOrder.paidInstallments}/${wo.paymentOrder.installments} parcelas`}
                </>
              ) : (
                'Não registrado'
              )}
            </Text>
          </View>
        </View>

        {wo.paymentOrder && (
          <View className="flex-row items-center mb-1">
            <Icon as={Banknote} size={16} className="text-muted-foreground" />
            <Text className="text-sm ml-1 ">
              {formatBRL(wo.paymentOrder?.totalValue)}
            </Text>
          </View>
        )}
      </ObjectCard.Content>
    </ObjectCard.Root>
  )
}

// Memoization with a custom comparator to avoid unnecessary re-renders
export const WorkOrderCard = React.memo(
  WorkOrderCardComponent,
  (prevProps, nextProps) => {
    // Returns true if props are EQUAL (must not re-render)
    // Returns false if props are DIFFERENT (must re-render)

    // Basic comparison
    if (
      prevProps.wo.id !== nextProps.wo.id ||
      prevProps.wo.status !== nextProps.wo.status ||
      prevProps.isLate !== nextProps.isLate
    ) {
      return false
    }

    // Date comparison
    if (
      prevProps.wo.scheduledDate.getTime() !==
      nextProps.wo.scheduledDate.getTime()
    ) {
      return false
    }

    const prevVisitTime = prevProps.wo.visitDate?.getTime()
    const nextVisitTime = nextProps.wo.visitDate?.getTime()
    if (prevVisitTime !== nextVisitTime) {
      return false
    }

    // Customer comparison
    if (
      prevProps.wo.customer.storeName !== nextProps.wo.customer.storeName ||
      prevProps.wo.customer.contactName !== nextProps.wo.customer.contactName
    ) {
      return false
    }

    // Customer address/phones comparison
    if (
      prevProps.wo.customer.phoneNumber?.value !==
        nextProps.wo.customer.phoneNumber?.value ||
      prevProps.wo.customer.landlineNumber?.value !==
        nextProps.wo.customer.landlineNumber?.value ||
      prevProps.wo.customer.isActiveWhatsApp() !==
        nextProps.wo.customer.isActiveWhatsApp() ||
      prevProps.wo.customer.storeAddress.getFullAddress() !==
        nextProps.wo.customer.storeAddress.getFullAddress()
    ) {
      return false
    }

    // Payment order comparison
    const prevPayment = prevProps.wo.paymentOrder
    const nextPayment = nextProps.wo.paymentOrder
    if (
      prevPayment?.isPaid !== nextPayment?.isPaid ||
      prevPayment?.method !== nextPayment?.method ||
      prevPayment?.totalValue !== nextPayment?.totalValue ||
      prevPayment?.paidInstallments !== nextPayment?.paidInstallments ||
      prevPayment?.installments !== nextPayment?.installments
    ) {
      return false
    }

    // Result comparison
    if (Boolean(prevProps.wo.result) !== Boolean(nextProps.wo.result)) {
      return false
    }

    // Callback comparison (reference)
    if (
      prevProps.onPress !== nextProps.onPress ||
      prevProps.onOptions !== nextProps.onOptions
    ) {
      return false
    }

    // If we got here, props are equal
    return true
  }
)
