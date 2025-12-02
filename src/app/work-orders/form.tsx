import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { Button } from '@/src/components/ui/button'
import { CustomerCombobox } from '@/src/components/ui/combobox/customer-combobox'
import { ProductCombobox } from '@/src/components/ui/combobox/product-combobox'
import { DatePickerInput } from '@/src/components/ui/date-picker-input'
import { BaseForm } from '@/src/components/ui/forms/base-form'
import {
  WorkOrderFormCreate,
  WorkOrderFormCreateRef,
} from '@/src/components/ui/forms/work-order-form-create'
import { Text } from '@/src/components/ui/text'
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import { WorkOrderResultItemInsertDTO } from '@/src/domain/validations/work-order-result-item.schema'
import { getErrorMessage } from '@/src/lib/utils'
import { router } from 'expo-router'
import { CircleQuestionMark, CreditCard, Package } from 'lucide-react-native'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'

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

  // Campos do WorkOrderResult
  exchangedProducts?: WorkOrderResultItemInsertDTO[]
  addedProducts?: WorkOrderResultItemInsertDTO[]
  removedProducts?: WorkOrderResultItemInsertDTO[]

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
  const { mutate: addWorkOrder, isPending } = workOrderHooks.addWorkOrder()

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

  const onSubmitFinal = (data: WorkOrderFormData) => {
    console.log('Submitting work order:', data)

    // Criar a work order básica
    const workOrderData = {
      customerId: data.customerId,
      scheduledDate: data.scheduledDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: WorkOrderStatus.PENDING,
      notes: data.notes,
    }

    /**
     * TODO: Implementar a lógica completa do fluxo:
     *
     * FLUXO COMPLETO:
     * ================
     *
     * 1. CRIAR WORK ORDER
     *    - Criar a WorkOrder com os dados básicos (customerId, scheduledDate, notes)
     *    - Status inicial: PENDING
     *
     * 2. ADICIONAR PRODUTOS AGENDADOS (se data.products existe e length > 0)
     *    - Para cada produto em data.products:
     *      - Criar WorkOrderItem com productId, quantity, priceSnapshot
     *      - Vincular à WorkOrder criada
     *
     * 3. CRIAR RELATÓRIO FINAL (se data.shouldCreateReport = true)
     *    a) Criar WorkOrderResult
     *       - Calcular totalValue baseado nos produtos trocados + adicionados
     *
     *    b) Criar WorkOrderResultItems
     *       - EXCHANGED: produtos de data.exchangedProducts
     *         (se havia produtos agendados, devem vir dali; senão, adicionar manualmente)
     *       - ADDED: produtos de data.addedProducts (produtos extras)
     *       - REMOVED: produtos de data.removedProducts (não foram trocados)
     *
     *    c) Atualizar status da WorkOrder baseado no resultado:
     *       - Se exchanged = 0 && added = 0 → FAILED
     *       - Se removed > 0 || exchanged < produtos.length → PARTIAL
     *       - Caso contrário → COMPLETED
     *
     *    d) Vincular WorkOrderResult à WorkOrder (resultId)
     *
     * 4. CRIAR ORDEM DE PAGAMENTO (se data.shouldCreatePayment = true)
     *    - Criar PaymentOrder com:
     *      - method: data.paymentMethod
     *      - totalValue: do WorkOrderResult (se existir) ou calcular dos produtos
     *      - installments: data.installments (se hasInstallments)
     *      - isPaid: data.isPaid (se não houver parcelamento)
     *      - paidInstallments: 0 (ou installments se isPaid = true)
     *
     *    - Vincular PaymentOrder à WorkOrder (paymentOrderId)
     *
     * 5. FINALIZAR
     *    - Sempre atualizar visitDate para agora quando houver relatório
     *    - Aplicar as transições de status apropriadas baseado no resultado
     */

    addWorkOrder(workOrderData)
    router.back()
  }

  const onSubmit = form.handleSubmit(onSubmitFinal)

  // Observar mudanças para condicionar visibilidade de campos
  const installments = form.watch('installments')
  const scheduledProducts = form.watch('products')

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
        // Step 1: Cliente e Data Agendada - via customRenderer
        {
          name: 'notes',
          label: 'Observações (Opcional)',
          placeholder: 'Adicione observações sobre a ordem',
          iconTooltip: 'Adicione observações relevantes para a ordem',
          icon: CircleQuestionMark,
        },
        // Step 2: Produtos Agendados - usando ProductCombobox via customRenderer no step
        // Step 3: Não tem campos - será uma tela com botões de decisão
        // Step 4: Produtos do Relatório
        // Se houver produtos agendados, mostrar mensagem sobre seleção
        ...(scheduledProducts && scheduledProducts.length > 0
          ? [
              {
                name: 'exchangedProducts' as const,
                label: 'Produtos Trocados (dos agendados)',
                placeholder: 'Selecione dos produtos agendados',
                icon: Package,
                iconTooltip:
                  'Selecione quais produtos agendados foram realmente trocados',
              },
            ]
          : [
              {
                name: 'exchangedProducts' as const,
                label: 'Produtos Trocados',
                placeholder: 'Adicione produtos trocados',
                icon: Package,
              },
            ]),
        {
          name: 'addedProducts',
          label: 'Produtos Adicionados',
          placeholder: 'Produtos extras não agendados',
          icon: Package,
          iconTooltip: 'Produtos adicionados além dos agendados',
        },
        {
          name: 'removedProducts',
          label: 'Produtos Removidos',
          placeholder: 'Produtos que não foram trocados',
          icon: Package,
          iconTooltip: 'Produtos agendados que não foram trocados',
        },
        // Step 5: Não tem campos - será uma tela com botões de decisão
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
                onPress={() => formRef.current?.goToNextStep()}
                className="w-full"
              >
                <Text>Criar Relatório Final</Text>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onPress={() => formRef.current?.submitForm()}
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
                onPress={() => formRef.current?.goToNextStep()}
                className="w-full"
              >
                <Text>Registrar Pagamento</Text>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onPress={() => formRef.current?.submitForm()}
                className="w-full"
              >
                <Text>Finalizar Sem Pagamento</Text>
              </Button>
            </View>
          ),
        },
        {
          label: 'Ordem de Pagamento',
          fields: [
            'method',
            'installments',
            ...(installments === 1 ? ['isPaid' as const] : []),
          ],
        },
      ]}
    />
  )
}
