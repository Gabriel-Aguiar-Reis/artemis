import { BaseForm, FormFieldProps } from '@/src/components/ui/forms/base-form'
import { getErrorMessage } from '@/src/lib/utils'
import { BaseSyntheticEvent } from 'react'
import { Control, FieldErrors, FieldValues, Path } from 'react-hook-form'

type ProductFormProps<T extends FieldValues> = {
  title: string
  onSubmit: (e?: BaseSyntheticEvent) => void
  errors: FieldErrors<T>
  control: Control<T>
  submitLabel: string
  loading?: boolean
  fields: FormFieldProps<T>[]
}

export function ProductForm<T extends FieldValues>({
  title,
  onSubmit,
  errors,
  control,
  submitLabel,
  loading,
  fields,
}: ProductFormProps<T>) {
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
              isSearch={fieldConfig.isSearch}
              onSearchPress={fieldConfig.onSearchPress}
              isSearchLoading={fieldConfig.isSearchLoading}
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
              isSearch={fieldConfig.isSearch}
              onSearchPress={fieldConfig.onSearchPress}
              isSearchLoading={fieldConfig.isSearchLoading}
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
