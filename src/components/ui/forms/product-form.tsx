import { getErrorMessage } from '@/src/lib/utils'
import { LucideIcon } from 'lucide-react-native'
import { BaseSyntheticEvent } from 'react'
import { Control, FieldErrors, FieldValues, Path } from 'react-hook-form'
import { BaseForm } from './base-form'

export function ProductForm<T extends FieldValues>({
  title,
  onSubmit,
  errors,
  control,
  submitLabel,
  loading,
  fields,
}: {
  title: string
  onSubmit: (e?: BaseSyntheticEvent) => void
  errors: FieldErrors<T>
  control: Control<T>
  submitLabel: string
  loading?: boolean
  fields: Array<{
    name: Path<T>
    label: string
    placeholder?: string
    icon?: LucideIcon
    alternate?: {
      icon: LucideIcon
      type: 'toSecret' | 'toDisabled'
    }
    iconTooltip?: string
    rules?: object
    inputProps?: Record<string, any>
    isNumber?: boolean
    isCurrency?: boolean
    isDialog?: boolean
    isSelect?: boolean
  }>
}) {
  return (
    <BaseForm.Root title={title}>
      {fields.map((fieldConfig) => {
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
            />
          )
        }
        if (fieldConfig.isNumber) {
          return (
            <BaseForm.Input.Number<T>
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
          />
        )
      })}
      <BaseForm.Switch<T>
        control={control}
        name={'isActive' as Path<T>}
        label="Produto Ativo"
      />
      <BaseForm.SubmitButton onPress={onSubmit} loading={loading}>
        {submitLabel}
      </BaseForm.SubmitButton>
    </BaseForm.Root>
  )
}
