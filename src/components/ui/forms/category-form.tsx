import { BaseForm } from '@/src/components/ui/forms/base-form'
import { LucideIcon } from 'lucide-react-native'
import { BaseSyntheticEvent } from 'react'
import { Control, FieldErrors, FieldValues, Path } from 'react-hook-form'

type CategoryFormProps<T extends FieldValues> = {
  title: string
  onSubmit: (e?: BaseSyntheticEvent) => void
  errors: FieldErrors<T>
  control: Control<T>
  nameIcon?: LucideIcon
  alternate?: {
    nameIcon: LucideIcon
    type: 'toSecret' | 'toDisabled'
  }
  nameIconTooltip?: string
  submitLabel: string
  loading?: boolean
}

export function CategoryForm<T extends FieldValues>({
  title,
  onSubmit,
  errors,
  control,
  nameIcon,
  alternate,
  nameIconTooltip,
  submitLabel,
  loading,
}: CategoryFormProps<T>) {
  return (
    <BaseForm.Root title={title}>
      <BaseForm.Input
        control={control}
        name={'name' as Path<T>}
        label="Nome da Categoria"
        placeholder="Ex. Documentos"
        error={
          typeof errors?.name?.message === 'string'
            ? errors.name.message
            : undefined
        }
        icon={nameIcon}
        alternate={
          alternate
            ? { icon: alternate.nameIcon, type: alternate.type }
            : undefined
        }
        iconTooltip={nameIconTooltip}
        rules={{ required: true }}
      />
      <BaseForm.Switch
        control={control}
        name={'isActive' as Path<T>}
        label="Categoria Ativa"
      />
      <BaseForm.SubmitButton onPress={onSubmit} loading={loading}>
        {submitLabel}
      </BaseForm.SubmitButton>
    </BaseForm.Root>
  )
}
