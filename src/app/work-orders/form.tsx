import { productHooks } from '@/src/application/hooks/product.hooks'
import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
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
import { computeResultTotal } from '@/src/domain/entities/work-order/work-order-rules'
import { getErrorMessage } from '@/src/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { CircleQuestionMark, CreditCard, Info } from 'lucide-react-native'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import Toast from 'react-native-toast-message'
import { z } from 'zod'

// Intermediate type for the comboboxes (includes productName)
export type WorkOrderResultItemInput = {
  productId: string
  productName: string
  quantity: number
  priceSnapshot: number
}

// Zod validation schema for the form
const workOrderFormSchema = z
  .object({
    // Control IDs
    workOrderId: z.uuid().optional(),
    paymentOrderId: z.uuid().optional(),
    workOrderResultId: z.uuid().optional(),

    // WorkOrder fields (required)
    customerId: z.uuid({ message: 'Selecione um cliente' }),
    scheduledDate: z.date({ message: 'Selecione uma data agendada' }),
    notes: z.string().max(500, 'Máximo de 500 caracteres').optional(),

    // Scheduled products (optional, but if filled in must have at least 1)
    products: z
      .array(
        z.object({
          productId: z.uuid(),
          quantity: z.number().int().min(1),
        })
      )
      .optional(),

    // WorkOrderResult fields (optional)
    exchangedProducts: z
      .array(
        z.object({
          productId: z.uuid(),
          productName: z.string(),
          quantity: z.number().int().min(1),
          priceSnapshot: z.number().nonnegative(),
        })
      )
      .optional(),
    addedProducts: z
      .array(
        z.object({
          productId: z.uuid(),
          productName: z.string(),
          quantity: z.number().int().min(1),
          priceSnapshot: z.number().nonnegative(),
        })
      )
      .optional(),
    removedProducts: z
      .array(
        z.object({
          productId: z.uuid(),
          productName: z.string(),
          quantity: z.number().int().min(1),
          priceSnapshot: z.number().nonnegative(),
        })
      )
      .optional(),

    // PaymentOrder fields (conditionally required)
    method: z.string().optional(),
    totalValue: z.string().optional(),
    installments: z.string().optional(),
    isPaid: z.boolean().optional(),
    paidInstallments: z.string().optional(),
    paymentDate: z.union([z.date(), z.string()]).optional().nullable(),

    // Flow control flags
    shouldCreateReport: z.boolean().optional(),
    shouldCreatePayment: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If shouldCreatePayment is true, method is required
      if (data.shouldCreatePayment === true) {
        return data.method && data.method.trim().length > 0
      }
      return true
    },
    {
      message: 'Método de pagamento é obrigatório',
      path: ['method'],
    }
  )

// Custom type for the full form flow
type WorkOrderFormData = z.infer<typeof workOrderFormSchema>

export default function WorkOrderFormScreen() {
  const { mutateAsync: createWorkOrder, isPending: isWorkOrderPending } =
    workOrderHooks.useCreateWorkOrderWithDetails()

  // Fetch products to use in the comboboxes
  const { data: allProducts } = productHooks.getProductsWithCategory()

  const isPending = isWorkOrderPending

  // Ref to control the navigation flow between steps
  const formRef = React.useRef<WorkOrderFormCreateRef>(null)

  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: {
      customerId: '',
      scheduledDate: new Date(),
      notes: '',
      products: [],
      exchangedProducts: [],
      addedProducts: [],
      removedProducts: [],
      method: '',
      installments: '1',
      isPaid: false,
      paymentDate: undefined,
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  // Logic to determine the next step based on the user's decisions
  const handleBeforeNext = async (currentStep: number) => {
    // Step 2 (Products) → Goes to Step 3 (Decision screen)
    if (currentStep === 1) {
      return true // Continue normally
    }

    // Step 3 (Decision screen) → User chooses via buttons, not via switch
    // Navigation will be controlled by the custom buttons
    if (currentStep === 2) {
      return false // Blocks automatic navigation, buttons control it
    }

    // Step 4 (Report) → Goes to Step 5 (Payment decision screen)
    if (currentStep === 3) {
      return true // Continues to the payment decision screen
    }

    // Step 5 (Payment decision screen) → User chooses via buttons
    if (currentStep === 4) {
      return false // Blocks automatic navigation, buttons control it
    }

    return true
  }

  const onSubmitFinal = async (data: WorkOrderFormData) => {
    // Prevents a double tap from creating two work orders
    if (isWorkOrderPending) return

    // Preparation: the scheduled price comes from the product's current record
    const missing = (data.products || []).filter(
      (p) => !allProducts?.some((prod) => prod.id === p.productId)
    )
    if (missing.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Não foi possível criar a ordem de serviço',
        text2: allProducts
          ? 'Algum produto selecionado não existe mais. Revise a lista.'
          : 'A lista de produtos ainda está carregando. Tente de novo.',
      })
      return
    }
    const priceOf = (productId: string) =>
      allProducts!.find((prod) => prod.id === productId)!.salePrice

    const toItem = (i: {
      productId: string
      quantity: number
      priceSnapshot: number
    }) => ({
      productId: i.productId,
      quantity: i.quantity,
      priceSnapshot: i.priceSnapshot,
    })

    // The payment equals the report total (exchanged + added)
    const paymentTotal = computeResultTotal(
      data.exchangedProducts || [],
      data.addedProducts || []
    )

    try {
      // Everything in a single transaction (work order + items + report + payment): if anything
      // fails nothing is written, and a resubmit does not duplicate the work order.
      const res = await createWorkOrder({
        customerId: data.customerId,
        scheduledDate: data.scheduledDate,
        notes: data.notes,
        items: (data.products || []).map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
          priceSnapshot: priceOf(p.productId),
        })),
        result: data.shouldCreateReport
          ? {
              exchanged: (data.exchangedProducts || []).map(toItem),
              added: (data.addedProducts || []).map(toItem),
              removed: (data.removedProducts || []).map(toItem),
            }
          : undefined,
        payment: data.shouldCreatePayment
          ? {
              method: data.method || 'Dinheiro',
              totalValue: paymentTotal,
              installments: Number(data.installments) || 1,
              isPaid: data.isPaid || false,
              paymentDate: data.paymentDate
                ? data.paymentDate instanceof Date
                  ? data.paymentDate.toISOString()
                  : data.paymentDate
                : null,
            }
          : undefined,
      })

      // Return to the index with the created work order ID
      router.replace({
        pathname: '/work-orders',
        params: { createdWorkOrderId: res.workOrder.id },
      })
    } catch (error) {
      // the save error toast is shown by the hook
      if (__DEV__) console.error('Error creating work order:', error)
    }
  }

  const onSubmit = form.handleSubmit(onSubmitFinal)

  // Watch changes to conditionally show fields
  const installments = Number(form.watch('installments')) || 1
  const isPaid = form.watch('isPaid')
  const paymentDate = form.watch('paymentDate')

  // When marked as paid, force installments = 1 and date to today if missing
  React.useEffect(() => {
    if (isPaid) {
      form.setValue('installments', '1')
      // If there is no payment date, set it to today
      if (!paymentDate) {
        form.setValue('paymentDate', new Date() as any)
      }
    }
  }, [isPaid, form])

  // If installments change to > 1, uncheck isPaid
  React.useEffect(() => {
    if ((installments || 1) > 1 && isPaid) {
      form.setValue('isPaid', false)
    }
  }, [installments, isPaid, form])

  // If the payment date is in the future, uncheck isPaid
  React.useEffect(() => {
    if (paymentDate && isPaid) {
      const selectedDate =
        paymentDate instanceof Date ? paymentDate : new Date(paymentDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      selectedDate.setHours(0, 0, 0, 0)

      if (selectedDate > today) {
        form.setValue('isPaid', false)
        form.setValue('paidInstallments', '0')
      }
    }
  }, [paymentDate])

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
        // Form fields - we now only use customRenderer in the steps
        // Step 6: Payment Order
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
        // Only show "Foi pago?" if there is no installment plan (installments = 1)
        ...(installments === 1
          ? [
              {
                name: 'isPaid' as const,
                label: 'Pagamento Realizado',
                isCheckbox: true,
              },
            ]
          : []),
      ]}
      steps={[
        {
          label: 'Cliente e Data',
          fields: ['customerId', 'scheduledDate', 'notes'],
          customRenderer: () => (
            <View className="flex-1 gap-4">
              <CustomerCombobox
                selectedCustomerId={form.watch('customerId') || ''}
                onCustomerChange={(customerId) =>
                  form.setValue('customerId', customerId)
                }
                label="Cliente"
                placeholder="Selecione o cliente"
                error={getErrorMessage(
                  form.formState.errors?.customerId?.message
                )}
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

              {/* Custom navigation buttons */}
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
                  onPress={async () => {
                    // Validate the step's required fields
                    const isValid = await form.trigger([
                      'customerId',
                      'scheduledDate',
                    ])
                    if (isValid) {
                      formRef.current?.handleNext()
                    }
                  }}
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
          fields: ['products'],
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

              {/* Custom navigation buttons */}
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
                  onPress={async () => {
                    // No specific validation here because products are optional
                    formRef.current?.handleNext()
                  }}
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
          fields: [], // Decision screen, no validation
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
          fields: ['exchangedProducts', 'addedProducts', 'removedProducts'],
          customRenderer: () => (
            <View className="flex-1 gap-4">
              <ExchangedProductsCombobox
                scheduledProducts={form.watch('products') || []}
                removedProducts={form.watch('removedProducts') || []}
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

              {/* Custom navigation buttons */}
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
                  onPress={async () => {
                    // No specific validation - report is optional
                    formRef.current?.handleNext()
                  }}
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
          fields: [], // Decision screen, no validation
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
          fields: ['method', 'installments'],
          customRenderer: () => {
            // Compute total based on the report products
            const exchangedProducts = form.watch('exchangedProducts') || []
            const addedProducts = form.watch('addedProducts') || []

            // Total derived from the report (not editable): computed here only
            // for display and again on submit. It used to call setValue during
            // render, which triggers cascading re-renders.
            const totalValue = computeResultTotal(
              exchangedProducts,
              addedProducts
            )

            const allProductItems = [
              ...exchangedProducts.map((p) => ({ ...p, type: 'Trocado' })),
              ...addedProducts.map((p) => ({ ...p, type: 'Adicionado' })),
            ]

            return (
              <View className="flex-1 gap-4">
                {/* Report summary */}
                {allProductItems.length > 0 && (
                  <View className="bg-accent/30 rounded-lg p-4 mb-2">
                    <Text className="font-semibold text-base mb-3">
                      Resumo do Relatório
                    </Text>

                    {/* Product list */}
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

                {/* Payment fields */}
                <BaseForm.Input
                  control={form.control}
                  name="method"
                  label="Método de Pagamento"
                  placeholder="Ex: Dinheiro, PIX, Débito, Cartão de Crédito"
                  icon={CreditCard}
                  error={getErrorMessage(
                    form.formState.errors?.method?.message
                  )}
                />

                <DatePickerInput
                  value={
                    form.watch('paymentDate')
                      ? typeof form.watch('paymentDate') === 'string'
                        ? new Date(form.watch('paymentDate')!)
                        : (form.watch('paymentDate') as Date)
                      : undefined
                  }
                  onDateChange={(date) =>
                    form.setValue('paymentDate', date as any)
                  }
                  label="Data de Pagamento (Opcional)"
                  placeholder="Selecione a data de pagamento"
                  error={getErrorMessage(
                    form.formState.errors?.paymentDate?.message
                  )}
                />

                {/* Payment explanatory alert */}
                <Alert icon={Info}>
                  <AlertTitle>Sobre o Pagamento</AlertTitle>
                  <AlertDescription>
                    {isPaid
                      ? 'Pagamento à vista foi marcado como realizado. O número de parcelas foi definido como 1.'
                      : (installments || 1) > 1
                        ? `Pagamento parcelado em ${installments}x. Você poderá marcar cada parcela como paga posteriormente.`
                        : 'Marque "Pagamento à Vista Realizado" se o valor foi pago à vista, ou defina o número de parcelas para pagamento parcelado.'}
                  </AlertDescription>
                </Alert>

                {installments === 1 && (
                  <BaseForm.Checkbox
                    control={form.control}
                    name="isPaid"
                    label="Pagamento à Vista Realizado"
                  />
                )}

                <BaseForm.Input
                  control={form.control}
                  name="installments"
                  label="Número de Parcelas"
                  placeholder={
                    isPaid
                      ? '1 (à vista)'
                      : 'Ex: 1 (à vista) ou mais (parcelado)'
                  }
                  icon={CircleQuestionMark}
                  iconTooltip="Para pagamento à vista, use 1. Para parcelado, defina o número de parcelas."
                  inputProps={{
                    keyboardType: 'numeric' as const,
                    editable: !isPaid,
                  }}
                  error={getErrorMessage(
                    form.formState.errors?.installments?.message
                  )}
                />

                {/* Custom navigation buttons */}
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
                    onPress={async () => {
                      // Validate the payment's required fields
                      const isValid = await form.trigger(['method'])
                      if (isValid) {
                        onSubmit()
                      }
                    }}
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
