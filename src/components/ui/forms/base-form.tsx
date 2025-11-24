import { FloatingLabelInput } from '@/src/components/ui/floating-label-input'
import { Label } from '@/src/components/ui/label'
import { Text } from '@/src/components/ui/text'
import { ButtonSubmit } from '@/src/components/ui/toasts/button-submit'
import { PERIODS } from '@/src/lib/utils'
import { Stack } from 'expo-router'
import { LucideIcon } from 'lucide-react-native'
import React, { BaseSyntheticEvent, ReactNode } from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'
import { ScrollView, Switch, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export type FormFieldProps<T extends FieldValues> = {
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
}

type RootProps = {
  title: string
  children: ReactNode
}
function Root({ title, children }: RootProps) {
  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title }} />
      <ScrollView className="flex-1">
        <View className="p-4 gap-2">{children}</View>
      </ScrollView>
    </SafeAreaView>
  )
}

type InputProps<T extends FieldValues> = {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  error?: string
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
}

function Input<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  icon,
  alternate,
  iconTooltip,
  rules,
  inputProps,
  isNumber,
  isCurrency,
  isDialog = false,
  isSelect = false,
}: InputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value } }) => {
        let selectedPeriod = 'dias'
        let selectedNumber = 1
        if (typeof value === 'string') {
          const match = value.match(/(\d+)\s*(dias|semanas|meses|anos)/)
          if (match) {
            selectedNumber = Number(match[1])
            selectedPeriod = match[2]
          }
        }

        // Keep a local string state for currency inputs so user can type freely
        // (including commas). We only update the form value with a number on blur.
        const [localCurrency, setLocalCurrency] = React.useState<string>(() => {
          if (!isCurrency) return ''
          if (typeof value === 'number')
            return value.toFixed(2).replace('.', ',')
          return (value as any) ?? ''
        })

        React.useEffect(() => {
          if (!isCurrency) return
          const v =
            typeof value === 'number'
              ? value.toFixed(2).replace('.', ',')
              : ((value as any) ?? '')
          if (v !== localCurrency) setLocalCurrency(v)
        }, [value])

        const baseProps = {
          label,
          placeholder,
          error,
          value: isCurrency ? localCurrency : value,
          onChangeText: isCurrency
            ? (text: string) => {
                setLocalCurrency(text)
              }
            : isNumber
              ? (text: string) =>
                  onChange(text === '' ? undefined : Number(text))
              : onChange,
          onBlur: () => {
            if (isCurrency) {
              let clean = (localCurrency || '').replace(/[^\d,.-]/g, '')
              const normalized = clean.replace(',', '.')
              const num = Number(normalized)
              onChange(normalized === '' || isNaN(num) ? 0 : num)
              onBlur?.()
            } else {
              onBlur?.()
            }
          },
          ...inputProps,
        }

        if (isSelect) {
          const selectProps = {
            ...baseProps,
            isSelect: true,
            selectOptions: inputProps?.selectOptions,
            onSelectChange: onChange,
            value: value,
            rightIcon: icon,
            rightIconTooltip: iconTooltip,
            alignTooltip: iconTooltip ? ('end' as const) : undefined,
          }
          if (alternate?.icon && alternate.type === 'toSecret') {
            return (
              <FloatingLabelInput
                {...selectProps}
                alternateRightIcon={alternate!.icon}
                alternateToSecret={true}
                startSecreted={false}
              />
            )
          }
          if (alternate?.icon && alternate.type === 'toDisabled') {
            return (
              <FloatingLabelInput
                {...selectProps}
                alternateRightIcon={alternate!.icon}
                alternateToDisabled={true}
                startDisabled={true}
              />
            )
          }
          return <FloatingLabelInput {...selectProps} />
        }

        const renderDialog = () => {
          const dialogProps = {
            ...baseProps,
            isDialog: true,
            period: selectedPeriod,
            number: selectedNumber,
            PERIODS,
            onWheelChange: onChange,
            value: value,
            rightIcon: icon,
            rightIconTooltip: iconTooltip,
            alignTooltip: iconTooltip ? ('end' as const) : undefined,
          }
          if (alternate?.icon && alternate.type === 'toSecret') {
            return (
              <FloatingLabelInput
                {...dialogProps}
                alternateRightIcon={alternate!.icon}
                alternateToSecret={true}
                startSecreted={false}
              />
            )
          }
          if (alternate?.icon && alternate.type === 'toDisabled') {
            return (
              <FloatingLabelInput
                {...dialogProps}
                alternateRightIcon={alternate!.icon}
                alternateToDisabled={true}
                startDisabled={true}
              />
            )
          }
          return <FloatingLabelInput {...dialogProps} />
        }

        const renderNoIcon = () => <FloatingLabelInput {...baseProps} />

        const renderAlternate = () => {
          if (alternate?.type === 'toSecret') {
            return (
              <FloatingLabelInput
                {...baseProps}
                rightIcon={icon}
                alternateRightIcon={alternate!.icon}
                alternateToSecret={true}
                startSecreted={false}
              />
            )
          }
          return (
            <FloatingLabelInput
              {...baseProps}
              rightIcon={icon}
              alternateRightIcon={alternate!.icon}
              alternateToDisabled={true}
              startDisabled={true}
            />
          )
        }

        const renderDefault = () => (
          <FloatingLabelInput
            {...baseProps}
            rightIcon={icon}
            rightIconTooltip={iconTooltip}
            alignTooltip="end"
          />
        )

        if (isDialog) return renderDialog()
        if (alternate) return renderAlternate()
        if (!icon) return renderNoIcon()
        return renderDefault()
      }}
    />
  )
}

type SwitchProps<T extends FieldValues> = {
  control: Control<T>
  name: Path<T>
  label: string
}
function SwitchField<T extends FieldValues>({
  control,
  name,
  label,
}: SwitchProps<T>) {
  return (
    <View className="flex-row items-center">
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <Switch
            key={value ? 'on' : 'off'}
            value={!!value}
            onValueChange={onChange}
          />
        )}
      />
      <Label className="ml-2">{label}</Label>
    </View>
  )
}

type SubmitButtonProps = {
  onPress: (e?: BaseSyntheticEvent) => void
  loading?: boolean
  children: ReactNode
}
function SubmitButton({ onPress, loading, children }: SubmitButtonProps) {
  return (
    <ButtonSubmit onPress={onPress} loading={loading}>
      <Text>{children}</Text>
    </ButtonSubmit>
  )
}

// Subcomponentes para Input
function CurrencyInput<T extends FieldValues>(
  props: Omit<InputProps<T>, 'isCurrency' | 'isNumber'>
) {
  return <Input {...props} isCurrency />
}
function NumberInput<T extends FieldValues>(
  props: Omit<InputProps<T>, 'isCurrency' | 'isNumber'>
) {
  return <Input {...props} isNumber />
}
Input.Currency = CurrencyInput
Input.Number = NumberInput

export const BaseForm = {
  Root,
  Input,
  Switch: SwitchField,
  SubmitButton,
}
