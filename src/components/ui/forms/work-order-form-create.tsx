import { Button } from '@/src/components/ui/button'
import { BaseForm, FormFieldProps } from '@/src/components/ui/forms/base-form'
import { Stepper } from '@/src/components/ui/stepper'
import { Text } from '@/src/components/ui/text'
import { getErrorMessage } from '@/src/lib/utils'
import {
  BaseSyntheticEvent,
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useState,
} from 'react'
import {
  Control,
  FieldErrors,
  FieldValues,
  UseFormTrigger,
} from 'react-hook-form'
import { KeyboardAvoidingView, Platform, View } from 'react-native'

type StepConfig<T extends FieldValues> = {
  label: string
  fields: FormFieldProps<T>['name'][]
  customRenderer?: () => ReactNode
}

type WorkOrderFormCreateProps<T extends FieldValues> = {
  title: string
  onSubmit: (e?: BaseSyntheticEvent) => void
  errors: FieldErrors<T>
  control: Control<T>
  trigger?: UseFormTrigger<T>
  onBeforeNext?: (
    currentStep: number
  ) => Promise<boolean | void> | boolean | void
  submitLabel: string
  loading?: boolean
  fields: FormFieldProps<T>[]
  steps: StepConfig<T>[]
}

export type WorkOrderFormCreateRef = {
  goToNextStep: () => void
  goToPrevStep: () => void
  submitForm: () => void
}

function WorkOrderFormCreateComponent<T extends FieldValues>(
  {
    title,
    onSubmit,
    errors,
    control,
    trigger,
    onBeforeNext,
    submitLabel,
    loading,
    fields,
    steps,
  }: WorkOrderFormCreateProps<T>,
  ref: React.Ref<WorkOrderFormCreateRef>
) {
  const [currentStep, setCurrentStep] = useState(0)

  const totalSteps = steps?.length ?? 0

  const step = steps?.[currentStep]
  const visibleFields = (() => {
    if (!steps || steps.length === 0) return fields
    if (!step) return []
    return fields.filter((f) =>
      step.fields.map((s) => String(s)).includes(String(f.name))
    )
  })()

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  const handleNext = async () => {
    const stepFields = steps?.[currentStep]?.fields ?? []
    if (stepFields.length > 0 && typeof trigger === 'function') {
      const valid = await trigger(stepFields)
      if (!valid) return
    }

    if (typeof onBeforeNext === 'function') {
      const result = await onBeforeNext(currentStep)
      if (result === false) return
    }

    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1)
    else onSubmit()
  }

  // Expõe métodos para uso externo via ref
  useImperativeHandle(ref, () => ({
    goToNextStep: () => {
      if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1)
    },
    goToPrevStep: () => {
      setCurrentStep((s) => Math.max(0, s - 1))
    },
    submitForm: onSubmit,
  }))

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={80}
    >
      <BaseForm.Root title={title}>
        {totalSteps > 1 && (
          <Stepper currentStep={currentStep + 1} totalSteps={totalSteps} />
        )}

        {step?.label && (
          <Text className="text-lg font-semibold self-center">
            {step.label}
          </Text>
        )}

        {/* Renderização customizada se fornecida */}
        {step?.customRenderer
          ? step.customRenderer()
          : /* Renderização padrão dos campos */
            visibleFields.map((fieldConfig) => {
              if (fieldConfig.isCurrency) {
                return (
                  <BaseForm.Input.Currency<T>
                    key={String(fieldConfig.name)}
                    control={control}
                    name={fieldConfig.name}
                    label={fieldConfig.label}
                    placeholder={fieldConfig.placeholder}
                    error={getErrorMessage(errors?.[fieldConfig.name]?.message)}
                    icon={fieldConfig.icon}
                    alternate={
                      String(fieldConfig.name) === 'name' &&
                      fieldConfig.alternate
                        ? {
                            icon: fieldConfig.alternate.icon,
                            type: fieldConfig.alternate.type,
                          }
                        : fieldConfig.alternate
                    }
                    iconTooltip={fieldConfig.iconTooltip}
                    rules={fieldConfig.rules}
                    inputProps={fieldConfig.inputProps}
                    isDialog={fieldConfig.isDialog}
                    isSelect={fieldConfig.isSelect}
                    isSearch={fieldConfig.isSearch}
                    onSearchPress={fieldConfig.onSearchPress}
                    isSearchLoading={fieldConfig.isSearchLoading}
                  />
                )
              }
              if (fieldConfig.isCheckbox) {
                return (
                  <BaseForm.Checkbox<T>
                    key={String(fieldConfig.name)}
                    control={control}
                    name={fieldConfig.name}
                    label={fieldConfig.label}
                    icon={fieldConfig.icon}
                    iconTooltip={fieldConfig.iconTooltip}
                    rules={fieldConfig.rules}
                  />
                )
              }

              return (
                <BaseForm.Input<T>
                  key={String(fieldConfig.name)}
                  control={control}
                  name={fieldConfig.name}
                  label={fieldConfig.label}
                  placeholder={fieldConfig.placeholder}
                  error={getErrorMessage(errors?.[fieldConfig.name]?.message)}
                  icon={fieldConfig.icon}
                  alternate={
                    String(fieldConfig.name) === 'name' && fieldConfig.alternate
                      ? {
                          icon: fieldConfig.alternate.icon,
                          type: fieldConfig.alternate.type,
                        }
                      : fieldConfig.alternate
                  }
                  iconTooltip={fieldConfig.iconTooltip}
                  rules={fieldConfig.rules}
                  inputProps={fieldConfig.inputProps}
                  isDialog={fieldConfig.isDialog}
                  isSelect={fieldConfig.isSelect}
                  isSearch={fieldConfig.isSearch}
                  onSearchPress={fieldConfig.onSearchPress}
                  isSearchLoading={fieldConfig.isSearchLoading}
                />
              )
            })}

        {/* Botões de navegação - só mostra se não tiver customRenderer */}
        {!step?.customRenderer && (
          <View className="flex-row justify-between w-full gap-2 mt-4">
            <Button
              variant="outline"
              size="default"
              onPress={handlePrev}
              disabled={currentStep === 0}
              className="w-2/5"
            >
              <Text>Anterior</Text>
            </Button>

            {currentStep < totalSteps - 1 ? (
              <Button variant="default" onPress={handleNext} className="w-2/5">
                <Text>Próximo</Text>
              </Button>
            ) : (
              <BaseForm.SubmitButton onPress={onSubmit} loading={loading}>
                {submitLabel}
              </BaseForm.SubmitButton>
            )}
          </View>
        )}
      </BaseForm.Root>
    </KeyboardAvoidingView>
  )
}

// Export com forwardRef para suportar refs
export const WorkOrderFormCreate = forwardRef(WorkOrderFormCreateComponent) as <
  T extends FieldValues,
>(
  props: WorkOrderFormCreateProps<T> & {
    ref?: React.Ref<WorkOrderFormCreateRef>
  }
) => ReturnType<typeof WorkOrderFormCreateComponent>
