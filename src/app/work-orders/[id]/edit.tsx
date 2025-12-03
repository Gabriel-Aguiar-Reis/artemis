import { workOrderHooks } from '@/src/application/hooks/work-order.hooks'
import { CustomerCombobox } from '@/src/components/ui/combobox/customer-combobox'
import { DatePickerInput } from '@/src/components/ui/date-picker-input'
import { BaseForm } from '@/src/components/ui/forms/base-form'
import { WorkOrderFormEdit } from '@/src/components/ui/forms/work-order-form-edit'
import { Text } from '@/src/components/ui/text'
import {
  WorkOrderUpdateDTO,
  workOrderUpdateSchema,
} from '@/src/domain/validations/work-order.schema'
import { getErrorMessage, UUID } from '@/src/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { router, useLocalSearchParams } from 'expo-router'
import { Pen, PenOff } from 'lucide-react-native'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WorkOrderEditScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()

  const { data: workOrder, isLoading: isLoadingWorkOrder } =
    workOrderHooks.getWorkOrder(params.id)
  const { mutate: updateWorkOrder, isPending } =
    workOrderHooks.updateWorkOrder()

  const form = useForm<WorkOrderUpdateDTO>({
    resolver: zodResolver(workOrderUpdateSchema),
    defaultValues: {
      customerId: '',
      scheduledDate: new Date(),
      notes: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  const onSubmit = form.handleSubmit((data: WorkOrderUpdateDTO) => {
    updateWorkOrder({
      id: params.id,
      customerId: data.customerId as UUID,
      scheduledDate: data.scheduledDate,
      notes: data.notes,
      updatedAt: new Date(),
    })
    router.back()
  })

  useEffect(() => {
    if (!workOrder) return

    const formValues: WorkOrderUpdateDTO = {
      customerId: workOrder.customer.id,
      scheduledDate: workOrder.scheduledDate,
      notes: workOrder.notes || '',
    }
    form.reset(formValues)
  }, [workOrder])

  if (isLoadingWorkOrder)
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Carregando ordem de serviço...</Text>
      </SafeAreaView>
    )

  if (!workOrder)
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Ordem de serviço não encontrada.</Text>
      </SafeAreaView>
    )

  return (
    <WorkOrderFormEdit
      title="Editar Ordem de Serviço"
      onSubmit={onSubmit}
      errors={form.formState.errors}
      control={form.control}
      trigger={form.trigger}
      submitLabel="Salvar Ordem de Serviço"
      loading={isPending}
      fields={[
        {
          name: 'customerId',
          label: 'Cliente',
          placeholder: 'Selecione o cliente',
        },
        {
          name: 'scheduledDate',
          label: 'Data Agendada',
          placeholder: 'Selecione a data agendada',
        },
        {
          name: 'notes',
          label: 'Observações',
          placeholder: 'Adicione observações sobre a ordem',
          icon: PenOff,
          alternate: { icon: Pen, type: 'toDisabled' },
        },
      ]}
      steps={[
        {
          label: 'Informações Básicas',
          fields: ['customerId', 'scheduledDate', 'notes'],
          customRenderer: () => (
            <View className="flex-1 gap-4">
              <CustomerCombobox
                selectedCustomerId={form.watch('customerId') || ''}
                onCustomerChange={(customerId) => {
                  form.setValue('customerId', customerId, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }}
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
                icon={Pen}
                alternate={{ icon: PenOff, type: 'toDisabled' }}
                error={getErrorMessage(form.formState.errors?.notes?.message)}
              />
            </View>
          ),
        },
      ]}
    />
  )
}
