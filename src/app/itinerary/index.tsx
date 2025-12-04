import { itineraryWorkOrderHooks } from '@/src/application/hooks/itinerary-work-order.hooks'
import { itineraryHooks } from '@/src/application/hooks/itinerary.hooks'
import { WhatsAppService } from '@/src/application/services/whatsapp.service'
import { BackToTopButton } from '@/src/components/ui/back-to-top-button'
import { ButtonFilter } from '@/src/components/ui/button-filter'
import { ButtonFinish } from '@/src/components/ui/button-finish'
import { ButtonNew } from '@/src/components/ui/button-new'
import { NotesDialog } from '@/src/components/ui/dialog/notes-dialog'
import { DragToggleButton } from '@/src/components/ui/drag-toggle-button'
import { Text } from '@/src/components/ui/text'
import { WorkOrderCard } from '@/src/components/ui/work-order-card'
import { ItineraryWorkOrder } from '@/src/domain/entities/itinerary-work-order/itinerary-work-order.entity'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { Stack, useRouter } from 'expo-router'
import {
  Edit,
  LucideIcon,
  Package,
  Plus,
  Receipt,
  ReceiptText,
} from 'lucide-react-native'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function ItineraryScreen() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<{
    title: string
    notes?: string
  } | null>(null)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)

  const { data: itinerary, isLoading } = itineraryHooks.getActiveItinerary()
  const { mutateAsync: updatePositions } =
    itineraryWorkOrderHooks.updatePositions()

  const [workOrders, setWorkOrders] = useState<ItineraryWorkOrder[]>([])

  useEffect(() => {
    if (itinerary?.workOrders) {
      setWorkOrders(itinerary.workOrders)
    }
  }, [itinerary?.workOrders])

  // Adicionado useRef e useState para FlatList e botão de voltar ao topo
  const flatListRef = useRef<any>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y
    setShowScrollBtn(offsetY > 0)
  }

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
  }

  const handleWorkOrderOptions = async (workOrder: WorkOrder) => {
    const customerName = workOrder.customer.storeName
    const date = workOrder.scheduledDate || workOrder.visitDate

    const options: {
      label: string
      icon?: LucideIcon
      onPress: () => void
      destructive?: boolean
      isWhatsApp?: boolean
    }[] = []

    options.push({
      label: 'Ver Observações',
      icon: ReceiptText,
      onPress: () => {
        setSelectedNotes({
          title: `${customerName} - ${date?.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })}`,
          notes: workOrder.notes,
        })
        setNotesDialogOpen(true)
      },
    })
    // Grupo: Ordem de Serviço
    options.push({
      label: 'Editar Cabeçalho da Ordem',
      icon: Edit,
      onPress: () => {
        router.push(`/work-orders/${workOrder.id}/edit`)
      },
    })

    options.push({
      label: 'Acessar Produtos Agendados',
      icon: Package,
      onPress: () => {
        router.push(`/work-orders/${workOrder.id}/products`)
      },
    })

    // Grupo: Resultado
    if (workOrder.result) {
      options.push({
        label: 'Acessar Relatório',
        icon: ReceiptText,
        onPress: () => {
          router.push(`/work-orders/${workOrder.id}/result`)
        },
      })
    } else {
      options.push({
        label: 'Criar Relatório',
        icon: Plus,
        onPress: () => {
          router.push(`/work-orders/${workOrder.id}/result/create`)
        },
      })
    }

    // Grupo: Pagamento
    if (workOrder.paymentOrder) {
      options.push({
        label: 'Acessar Pagamento',
        icon: Receipt,
        onPress: () => {
          router.push(`/work-orders/${workOrder.id}/payment`)
        },
      })
    } else if (workOrder.result) {
      options.push({
        label: 'Criar Pagamento',
        icon: Plus,
        onPress: () => {
          router.push(`/work-orders/${workOrder.id}/payment/create`)
        },
      })
    }

    // WhatsApp
    if (workOrder.customer.isActiveWhatsApp()) {
      options.push({
        label: 'Avisar cliente da visita',
        onPress: () => {
          try {
            WhatsAppService.sendWorkOrderMessage(workOrder, true)
          } catch (error) {
            console.error('Erro ao enviar WhatsApp:', error)
          }
        },
        isWhatsApp: true,
      })

      options.push({
        label: 'Enviar resumo ao cliente',
        onPress: () => {
          try {
            WhatsAppService.sendWorkOrderMessage(workOrder, false)
          } catch (error) {
            console.error('Erro ao enviar WhatsApp:', error)
          }
        },
        isWhatsApp: true,
      })
    }

    await SheetManager.show('options-sheet', {
      payload: {
        title: `${customerName} - ${date?.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })}`,
        options,
      },
    })
  }

  memo(WorkOrderCard)

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ItineraryWorkOrder>) => {
      const animatedStyle = useAnimatedStyle(() => {
        return {
          transform: [
            {
              scale: withSpring(isActive ? 1.05 : 1, {
                stiffness: 500,
              }),
            },
          ],
          opacity: withSpring(isActive ? 0.9 : 1),
        }
      })

      return (
        <AnimatedPressable onLongPress={drag} style={animatedStyle}>
          <View className="px-4">
            <WorkOrderCard
              wo={item.workOrder}
              onPress={() => handleWorkOrderOptions(item.workOrder)}
            />
          </View>
        </AnimatedPressable>
      )
    },
    []
  )

  const handleDragEnd = useCallback(
    async ({ data }: { data: ItineraryWorkOrder[] }) => {
      const updates = data.map((item, index) => ({
        id: item.id,
        position: index + 1,
      }))
      await (updatePositions as any)([updates])
    },
    [updatePositions]
  )

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1">
        <Stack.Screen
          options={{
            headerTitle: 'Itinerário',
            headerRight: () => (
              <View className="flex-row gap-2">
                <ButtonFilter
                  href={{
                    pathname: '/itinerary/search',
                    params: {},
                  }}
                  isActive={false}
                />
                {itinerary && !itinerary.isFinished ? (
                  <ButtonFinish href="/itinerary/finish" />
                ) : (
                  <ButtonNew href="/itinerary/form" />
                )}
              </View>
            ),
          }}
        />
        {isLoading ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-muted-foreground">
              Carregando itinerário...
            </Text>
          </View>
        ) : !itinerary ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-muted-foreground">
              Nenhum Itinerário sendo utilizado.{' \n'}
              Clique no + para fazer um novo.
            </Text>
          </View>
        ) : (
          <>
            <Text className="font-bold text-center border-b border-border pb-2">
              Itinerário{' '}
              {itinerary.initialItineraryDate.toLocaleDateString('pt-BR')} -{' '}
              {itinerary.finalItineraryDate.toLocaleDateString('pt-BR')}
            </Text>

            {!workOrders || workOrders.length === 0 ? (
              <View className="flex-1 items-center justify-center px-4">
                <Text className="text-center text-muted-foreground">
                  Há algo errado!{'\n'}
                  Nenhuma ordem de serviço encontrada{'\n'}
                  no período escolhido.
                </Text>
              </View>
            ) : (
              <DraggableFlatList
                ref={flatListRef}
                data={workOrders}
                renderItem={renderItem}
                onScroll={handleScroll}
                keyExtractor={(item) => item.id}
                onDragEnd={handleDragEnd}
                ListHeaderComponent={<View className="h-4" />}
                ListFooterComponent={<View className="h-16" />}
                activationDistance={20}
                animationConfig={{ damping: 20, mass: 0.5, stiffness: 500 }}
              />
            )}

            <DragToggleButton onPress={() => setIsDragging(!isDragging)} />
            {/* Botão de voltar ao topo */}
            <BackToTopButton isVisible={showScrollBtn} onPress={scrollToTop} />

            {selectedNotes && (
              <NotesDialog
                open={notesDialogOpen}
                onOpenChange={setNotesDialogOpen}
                title={selectedNotes.title}
                notes={selectedNotes.notes}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}
