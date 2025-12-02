import { paymentOrderHooks } from '@/src/application/hooks/payment-order.hooks'
import { productHooks } from '@/src/application/hooks/product.hooks'
import { workOrderResultItemHooks } from '@/src/application/hooks/work-order-result-item.hooks'
import { workOrderResultHooks } from '@/src/application/hooks/work-order-result.hooks'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Button } from '@/src/components/ui/button'
import { AddedProductsCombobox } from '@/src/components/ui/combobox/added-products-combobox'
import { CustomerCombobox } from '@/src/components/ui/combobox/customer-combobox'
import { ExchangedProductsCombobox } from '@/src/components/ui/combobox/exchanged-products-combobox'
import { ProductCombobox } from '@/src/components/ui/combobox/product-combobox'
import { RemovedProductsCombobox } from '@/src/components/ui/combobox/removed-products-combobox'
import { DatePickerInput } from '@/src/components/ui/date-picker-input'
import { BaseForm } from '@/src/components/ui/forms/base-form'
import {
  WorkOrderFormCreate,
  WorkOrderFormCreateRef,
} from '@/src/components/ui/forms/work-order-form-create'
import { Text } from '@/src/components/ui/text'
import { ProductSnapshot } from '@/src/domain/entities/work-order-item/value-objects/product-snapshot.vo'
import { WorkOrderItem } from '@/src/domain/entities/work-order-item/work-order-item.entity'
import {
  WorkOrderResultItem,
  WorkOrderResultItemType,
} from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import { getErrorMessage, UUID } from '@/src/lib/utils'
import { router } from 'expo-router'
import { CircleQuestionMark, CreditCard } from 'lucide-react-native'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import Toast from 'react-native-toast-message'
import uuid from 'react-native-uuid'

// Tipo intermediário para os comboboxes (inclui productName)
export type WorkOrderResultItemInput = {
  productId: string
  productName: string
  quantity: number
  priceSnapshot: number
}

// Tipo customizado para o fluxo completo do formulário
type WorkOrderFormData = {
  // IDs de controle
  workOrderId?: string
  paymentOrderId?: string
  workOrderResultId?: string

  // Campos da WorkOrder
  customerId: string
  scheduledDate: Date
  notes?: string

  // Produtos agendados (para WorkOrderItems)
  products?: { productId: string; quantity: number }[]

  // Campos do WorkOrderResult (usando tipo intermediário com productName)
  exchangedProducts?: WorkOrderResultItemInput[]
  addedProducts?: WorkOrderResultItemInput[]
  removedProducts?: WorkOrderResultItemInput[]

  // Campos da PaymentOrder
  method?: string
  totalValue?: number
  installments?: number
  isPaid?: boolean
  paidInstallments?: number

  // Flags de controle do fluxo
  shouldCreateReport?: boolean
  shouldCreatePayment?: boolean
}

export default function WorkOrderFormScreen() {
  const { mutateAsync: addWorkOrder, isPending: isWorkOrderPending } =
    workOrderHooks.addWorkOrder()
  const { mutateAsync: updateWorkOrderWithResult } =
    workOrderHooks.updateWorkOrderWithResult()
  const { mutateAsync: updateWorkOrderWithPayment } =
    workOrderHooks.updateWorkOrderWithPayment()
  const { mutateAsync: addWorkOrderResult } =
    workOrderResultHooks.addWorkOrderResult()
  const { mutateAsync: addWorkOrderResultItems } =
    workOrderResultItemHooks.addWorkOrderResultItems()
  const { mutateAsync: addPaymentOrder } = paymentOrderHooks.addPaymentOrder()

  // Buscar produtos para usar nos comboboxes
  const { data: allProducts = [] } = productHooks.getProductsWithCategory()

  const isPending = isWorkOrderPending

  // Ref para controlar o fluxo de navegação entre steps
  const formRef = React.useRef<WorkOrderFormCreateRef>(null)

  const form = useForm<WorkOrderFormData>({
    defaultValues: {
      customerId: '',
      scheduledDate: new Date(),
      notes: '',
      products: [],
      exchangedProducts: [],
      addedProducts: [],
      removedProducts: [],
      method: '',
      installments: 1,
      isPaid: false,
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  // Lógica para determinar próximo step baseado nas decisões do usuário
  const handleBeforeNext = async (currentStep: number) => {
    const values = form.getValues()

    // Step 2 (Produtos) → Vai para Step 3 (Tela de decisão)
    if (currentStep === 1) {
      return true // Continua normalmente
    }

    // Step 3 (Tela de Decisão) → Usuário escolhe via botões, não por switch
    // A navegação será controlada pelos botões customizados
    if (currentStep === 2) {
      return false // Bloqueia navegação automática, botões controlam
    }

    // Step 4 (Relatório) → Vai para Step 5 (Tela de decisão de pagamento)
    if (currentStep === 3) {
      return true // Continua para tela de decisão de pagamento
    }

    // Step 5 (Tela de Decisão de Pagamento) → Usuário escolhe via botões
    if (currentStep === 4) {
      return false // Bloqueia navegação automática, botões controlam
    }

    return true
  }

  const onSubmitFinal = async (data: WorkOrderFormData) => {
    try {
      console.log('Submitting work order:', data)

      // 1. CRIAR WORK ORDER
      // Converter produtos agendados para WorkOrderItems completos
      const workOrderItems = (data.products || []).map((p) => {
        const productInfo = allProducts.find((prod) => prod.id === p.productId)
        if (!productInfo) {
          throw new Error(`Produto ${p.productId} não encontrado`)
        }

        const snapshot = new ProductSnapshot(
          productInfo.id as UUID,
          productInfo.name,
          productInfo.salePrice
        )

        return WorkOrderItem.fromProductSnapshot(
          snapshot,
          p.quantity,
          productInfo.salePrice
        )
      })

      const workOrderData = {
        customerId: data.customerId,
        scheduledDate: data.scheduledDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: WorkOrderStatus.PENDING,
        notes: data.notes,
        products: workOrderItems, // WorkOrderItems completos
      }

      // Criar a work order (retorna o ID criado)
      const workOrderId = await addWorkOrder(workOrderData)

      // 2. CRIAR RELATÓRIO FINAL (se shouldCreateReport = true)
      if (data.shouldCreateReport) {
        const workOrderResultId = uuid.v4() as UUID

        // 2a. Calcular totalValue baseado nos produtos trocados + adicionados
        let totalValue = 0

        const exchangedItems: WorkOrderResultItem[] = []
        const addedItems: WorkOrderResultItem[] = []
        const removedItems: WorkOrderResultItem[] = []

        // Processar produtos trocados
        if (data.exchangedProducts && data.exchangedProducts.length > 0) {
          data.exchangedProducts.forEach((item) => {
            const snapshot = new ProductSnapshot(
              item.productId as UUID,
              item.productName,
              item.priceSnapshot
            )

            const resultItem = WorkOrderResultItem.fromProductSnapshot(
              uuid.v4() as UUID,
              snapshot,
              workOrderResultId,
              item.quantity,
              WorkOrderResultItemType.EXCHANGED,
              item.priceSnapshot,
              undefined
            )

            exchangedItems.push(resultItem)
            totalValue += item.priceSnapshot * item.quantity
          })
        }

        // Processar produtos adicionados
        if (data.addedProducts && data.addedProducts.length > 0) {
          data.addedProducts.forEach((item) => {
            const snapshot = new ProductSnapshot(
              item.productId as UUID,
              item.productName,
              item.priceSnapshot
            )

            const resultItem = WorkOrderResultItem.fromProductSnapshot(
              uuid.v4() as UUID,
              snapshot,
              workOrderResultId,
              item.quantity,
              WorkOrderResultItemType.ADDED,
              item.priceSnapshot,
              undefined
            )

            addedItems.push(resultItem)
            totalValue += item.priceSnapshot * item.quantity
          })
        }

        // Processar produtos removidos (não afetam o totalValue)
        if (data.removedProducts && data.removedProducts.length > 0) {
          data.removedProducts.forEach((item) => {
            const snapshot = new ProductSnapshot(
              item.productId as UUID,
              item.productName,
              item.priceSnapshot
            )

            const resultItem = WorkOrderResultItem.fromProductSnapshot(
              uuid.v4() as UUID,
              snapshot,
              workOrderResultId,
              item.quantity,
              WorkOrderResultItemType.REMOVED,
              item.priceSnapshot,
              undefined
            )

            removedItems.push(resultItem)
          })
        }

        // 2b. Criar WorkOrderResult
        await addWorkOrderResult({
          id: workOrderResultId,
          totalValue,
        })

        // 2c. Criar WorkOrderResultItems
        const allResultItems = [
          ...exchangedItems,
          ...addedItems,
          ...removedItems,
        ]

        if (allResultItems.length > 0) {
          // Adicionar todos os items de uma vez (já são entidades WorkOrderResultItem)
          // IMPORTANTE: Passar como [array] porque o hook usa apply e desestrutura arrays
          await (addWorkOrderResultItems as any)([allResultItems])
        }

        // 2d. Determinar status baseado no resultado
        let newStatus = WorkOrderStatus.COMPLETED

        const scheduledProductsCount = data.products?.length || 0
        const exchangedCount = exchangedItems.length
        const removedCount = removedItems.length

        if (exchangedCount === 0 && addedItems.length === 0) {
          newStatus = WorkOrderStatus.FAILED
        } else if (
          removedCount > 0 ||
          (scheduledProductsCount > 0 &&
            exchangedCount < scheduledProductsCount)
        ) {
          newStatus = WorkOrderStatus.PARTIAL
        }

        // Atualizar WorkOrder com resultado e status
        await updateWorkOrderWithResult([
          workOrderId,
          workOrderResultId,
          newStatus,
          new Date(),
        ])
      }

      // 3. CRIAR ORDEM DE PAGAMENTO (se shouldCreatePayment = true)
      if (data.shouldCreatePayment) {
        // Usar totalValue do result se existir, senão calcular dos produtos
        let paymentTotal = data.totalValue || 0

        const paymentOrderId = await addPaymentOrder({
          method: data.method || 'Dinheiro',
          totalValue: paymentTotal,
          installments: data.installments || 1,
          isPaid: data.isPaid || false,
          paidInstallments: data.isPaid ? data.installments || 1 : 0,
        })

        // Vincular PaymentOrder à WorkOrder
        await updateWorkOrderWithPayment([workOrderId, paymentOrderId])
      }

      Toast.show({
        type: 'success',
        text1: 'Ordem de serviço criada com sucesso!',
      })

      console.log('Work order created successfully')
      router.back()
    } catch (error) {
      console.error('Error creating work order:', error)
      Toast.show({
        type: 'error',
        text1: 'Erro ao criar ordem de serviço',
        text2: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    }
  }

  const onSubmit = form.handleSubmit(onSubmitFinal)

  // Observar mudanças para condicionar visibilidade de campos
  const installments = form.watch('installments')

  return (
    <WorkOrderFormCreate
      ref={formRef}
      title="Nova Ordem de Serviço"
      onSubmit={onSubmit}
      errors={form.formState.errors}
      control={form.control}
      trigger={form.trigger}
      onBeforeNext={handleBeforeNext}
      submitLabel="Salvar Ordem de Serviço"
      loading={isPending}
      fields={[
        // Campos do formulário - agora usamos apenas customRenderer nos steps
        // Step 6: Ordem de Pagamento
        {
          name: 'method',
          label: 'Método de Pagamento',
          placeholder: 'Ex: Dinheiro, PIX, Débito',
          icon: CreditCard,
        },
        {
          name: 'installments',
          label: 'Número de Parcelas',
          placeholder: 'Ex: 1 (ou mais se parcelado)',
          icon: CircleQuestionMark,
          inputProps: { keyboardType: 'numeric' as const },
        },
        // Só mostra "Foi pago?" se não houver parcelamento (installments = 1)
        ...(installments === 1
          ? [
              {
                name: 'isPaid' as const,
                label: 'Foi pago?',
                isSwitch: true,
              },
            ]
          : []),
      ]}
      steps={[
        {
          label: 'Cliente e Data',
          fields: [],
          customRenderer: () => (
            <View className="flex-1 gap-4">
              <CustomerCombobox
                selectedCustomerId={form.watch('customerId') || ''}
                onCustomerChange={(customerId) =>
                  form.setValue('customerId', customerId)
                }
                label="Cliente"
                placeholder="Selecione o cliente"
              />

              <DatePickerInput
                value={form.watch('scheduledDate')}
                onDateChange={(date) => form.setValue('scheduledDate', date)}
                label="Data Agendada"
                placeholder="Selecione a data agendada"
                minDate={new Date()}
                error={getErrorMessage(
                  form.formState.errors?.scheduledDate?.message
                )}
              />

              <BaseForm.Input
                control={form.control}
                name="notes"
                label="Observações (Opcional)"
                placeholder="Adicione observações sobre a ordem"
                iconTooltip="Adicione observações relevantes para a ordem"
                icon={CircleQuestionMark}
                error={getErrorMessage(form.formState.errors?.notes?.message)}
              />

              {/* Botões de navegação customizados */}
              <View className="flex-row justify-between w-full gap-2 mt-auto">
                <Button
                  variant="outline"
                  size="default"
                  onPress={() => formRef.current?.goToPrevStep?.()}
                  disabled={true}
                  className="w-2/5"
                >
                  <Text>Anterior</Text>
                </Button>

                <Button
                  variant="default"
                  onPress={() => formRef.current?.goToNextStep()}
                  className="w-2/5"
                >
                  <Text>Próximo</Text>
                </Button>
              </View>
            </View>
          ),
        },
        {
          label: 'Produtos Agendados',
          fields: [],
          customRenderer: () => (
            <View className="flex-1 gap-4">
              <ProductCombobox
                selectedProducts={form.watch('products') || []}
                onProductsChange={(products) =>
                  form.setValue('products', products)
                }
                label="Produtos Agendados"
                placeholder="Selecione os produtos"
                multiple={true}
              />

              {/* Botões de navegação customizados */}
              <View className="flex-row justify-between w-full gap-2 mt-auto">
                <Button
                  variant="outline"
                  size="default"
                  onPress={() => formRef.current?.goToPrevStep?.()}
                  className="w-2/5"
                >
                  <Text>Anterior</Text>
                </Button>

                <Button
                  variant="default"
                  onPress={() => formRef.current?.goToNextStep()}
                  className="w-2/5"
                >
                  <Text>Próximo</Text>
                </Button>
              </View>
            </View>
          ),
        },
        {
          label: 'Próximos Passos',
          fields: [], // Tela de decisão com botões
          customRenderer: () => (
            <View className="flex-1 justify-center items-center gap-4 p-6">
              <Text className="text-lg font-semibold text-center mb-4">
                Deseja criar um relatório final para esta ordem de serviço?
              </Text>

              <Button
                variant="default"
                size="lg"
                onPress={() => {
                  form.setValue('shouldCreateReport', true)
                  formRef.current?.goToNextStep()
                }}
                className="w-full"
              >
                <Text>Criar Relatório Final</Text>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onPress={() => {
                  form.setValue('shouldCreateReport', false)
                  formRef.current?.submitForm()
                }}
                className="w-full"
              >
                <Text>Finalizar Sem Relatório</Text>
              </Button>
            </View>
          ),
        },
        {
          label: 'Relatório Final',
          fields: [],
          customRenderer: () => (
            <View className="flex-1 gap-4">
              <ExchangedProductsCombobox
                scheduledProducts={form.watch('products') || []}
                selectedExchangedProducts={
                  form.watch('exchangedProducts') || []
                }
                onExchangedProductsChange={(products) =>
                  form.setValue('exchangedProducts', products)
                }
                availableProducts={allProducts}
                label="Produtos Trocados"
                placeholder="Selecione dos produtos agendados"
              />

              <AddedProductsCombobox
                selectedAddedProducts={form.watch('addedProducts') || []}
                onAddedProductsChange={(products) =>
                  form.setValue('addedProducts', products)
                }
                label="Produtos Adicionados"
                placeholder="Produtos extras não agendados"
              />

              <RemovedProductsCombobox
                scheduledProducts={form.watch('products') || []}
                exchangedProducts={form.watch('exchangedProducts') || []}
                selectedRemovedProducts={form.watch('removedProducts') || []}
                onRemovedProductsChange={(products) =>
                  form.setValue('removedProducts', products)
                }
                availableProducts={allProducts}
                label="Produtos Removidos"
                placeholder="Produtos não trocados"
              />

              {/* Botões de navegação customizados */}
              <View className="flex-row justify-between w-full gap-2 mt-auto">
                <Button
                  variant="outline"
                  size="default"
                  onPress={() => formRef.current?.goToPrevStep?.()}
                  className="w-2/5"
                >
                  <Text>Anterior</Text>
                </Button>

                <Button
                  variant="default"
                  onPress={() => formRef.current?.goToNextStep()}
                  className="w-2/5"
                >
                  <Text>Próximo</Text>
                </Button>
              </View>
            </View>
          ),
        },
        {
          label: 'Criar Pagamento?',
          fields: [], // Tela de decisão com botões
          customRenderer: () => (
            <View className="flex-1 justify-center items-center gap-4 p-6">
              <Text className="text-lg font-semibold text-center mb-4">
                Deseja registrar uma ordem de pagamento?
              </Text>

              <Button
                variant="default"
                size="lg"
                onPress={() => {
                  form.setValue('shouldCreatePayment', true)
                  formRef.current?.goToNextStep()
                }}
                className="w-full"
              >
                <Text>Registrar Pagamento</Text>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onPress={() => {
                  form.setValue('shouldCreatePayment', false)
                  formRef.current?.submitForm()
                }}
                className="w-full"
              >
                <Text>Finalizar Sem Pagamento</Text>
              </Button>
            </View>
          ),
        },
        {
          label: 'Ordem de Pagamento',
          fields: [],
          customRenderer: () => {
            // Calcular total baseado nos produtos do relatório
            const exchangedProducts = form.watch('exchangedProducts') || []
            const addedProducts = form.watch('addedProducts') || []

            const totalValue =
              exchangedProducts.reduce(
                (sum, p) => sum + p.priceSnapshot * p.quantity,
                0
              ) +
              addedProducts.reduce(
                (sum, p) => sum + p.priceSnapshot * p.quantity,
                0
              )

            // Atualizar totalValue no formulário (sem useEffect)
            if (form.getValues('totalValue') !== totalValue) {
              form.setValue('totalValue', totalValue, { shouldValidate: false })
            }

            const allProductItems = [
              ...exchangedProducts.map((p) => ({ ...p, type: 'Trocado' })),
              ...addedProducts.map((p) => ({ ...p, type: 'Adicionado' })),
            ]

            return (
              <View className="flex-1 gap-4">
                {/* Resumo do Relatório */}
                {allProductItems.length > 0 && (
                  <View className="bg-accent/30 rounded-lg p-4 mb-2">
                    <Text className="font-semibold text-base mb-3">
                      Resumo do Relatório
                    </Text>

                    {/* Lista de produtos */}
                    <View className="gap-2 mb-3">
                      {allProductItems.map((item, index) => (
                        <View
                          key={`${item.productId}-${index}`}
                          className="flex-row justify-between items-center py-2 border-b border-border/50"
                        >
                          <View className="flex-1">
                            <Text className="text-sm font-medium">
                              {item.productName}
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                              {item.type} • {item.quantity}x
                            </Text>
                          </View>
                          <Text className="text-xs text-muted-foreground">
                            {item.quantity}x R$
                            {item.priceSnapshot.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            ={' '}
                          </Text>
                          <Text className="text-sm font-semibold">
                            R${' '}
                            {(
                              item.priceSnapshot * item.quantity
                            ).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Total */}
                    <View className="flex-row justify-between items-center pt-3 border-t-2 border-border">
                      <Text className="font-bold text-lg">Valor Total:</Text>
                      <Text className="font-bold text-xl text-primary">
                        R${' '}
                        {totalValue.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Campos do pagamento */}
                <BaseForm.Input
                  control={form.control}
                  name="method"
                  label="Método de Pagamento"
                  placeholder="Ex: Dinheiro, PIX, Débito"
                  icon={CreditCard}
                  error={getErrorMessage(
                    form.formState.errors?.method?.message
                  )}
                />

                {installments === 1 && (
                  <BaseForm.Switch
                    control={form.control}
                    name="isPaid"
                    label="Pagamento Feito"
                  />
                )}
                <BaseForm.Input
                  control={form.control}
                  name="installments"
                  label="Número de Parcelas"
                  placeholder="Ex: 1 (ou mais se parcelado)"
                  icon={CircleQuestionMark}
                  inputProps={{ keyboardType: 'numeric' as const }}
                  error={getErrorMessage(
                    form.formState.errors?.installments?.message
                  )}
                />

                {/* Botões de navegação customizados */}
                <View className="flex-row justify-between w-full gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="default"
                    onPress={() => formRef.current?.goToPrevStep?.()}
                    className="w-2/5"
                  >
                    <Text>Anterior</Text>
                  </Button>

                  <Button
                    variant="default"
                    onPress={onSubmit}
                    disabled={isPending}
                    className="w-2/5"
                  >
                    <Text>{isPending ? 'Salvando...' : 'Salvar'}</Text>
                  </Button>
                </View>
              </View>
            )
          },
        },
      ]}
    />
  )
}
