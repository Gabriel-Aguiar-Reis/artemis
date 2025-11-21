import { FloatingLabelInput } from '@/src/components/ui/floating-label-input'
import { Label } from '@/src/components/ui/label'
import { Text } from '@/src/components/ui/text'
import { ButtonSubmit } from '@/src/components/ui/toasts/button-submit'
import { Stack } from 'expo-router'
import { LucideIcon } from 'lucide-react-native'
import { BaseSyntheticEvent, ReactNode } from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'
import { ScrollView, Switch, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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

const PERIODS = [
  { nome: 'dias', range: Array.from({ length: 31 }, (_, i) => i + 1) },
  { nome: 'semanas', range: Array.from({ length: 4 }, (_, i) => i + 1) },
  { nome: 'meses', range: Array.from({ length: 100 }, (_, i) => i + 1) },
  { nome: 'anos', range: Array.from({ length: 20 }, (_, i) => i + 1) },
]

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
        const baseProps = {
          label,
          placeholder,
          error,
          value: value,
          onChangeText: isCurrency
            ? (text: string) => {
                let clean = text.replace(/[^\d,.-]/g, '')
                const normalized = clean.replace(',', '.')
                const num = Number(normalized)
                onChange(normalized === '' || isNaN(num) ? 0 : num)
              }
            : isNumber
              ? (text: string) =>
                  onChange(text === '' ? undefined : Number(text))
              : onChange,
          onBlur: onBlur,
          ...inputProps,
        }

        if (isDialog) {
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
                alternateRightIcon={alternate.icon}
                alternateToSecret={true}
                startSecreted={false}
              />
            )
          }
          if (alternate?.icon && alternate.type === 'toDisabled') {
            return (
              <FloatingLabelInput
                {...dialogProps}
                alternateRightIcon={alternate.icon}
                alternateToDisabled={true}
                startDisabled={true}
              />
            )
          }
          return <FloatingLabelInput {...dialogProps} />
        }

        if (!icon) {
          return <FloatingLabelInput {...baseProps} />
        }
        if (alternate) {
          if (alternate.type === 'toSecret') {
            return (
              <FloatingLabelInput
                {...baseProps}
                rightIcon={icon}
                alternateRightIcon={alternate.icon}
                alternateToSecret={true}
                startSecreted={false}
              />
            )
          } else {
            return (
              <FloatingLabelInput
                {...baseProps}
                rightIcon={icon}
                alternateRightIcon={alternate.icon}
                alternateToDisabled={true}
                startDisabled={true}
              />
            )
          }
        }
        return (
          <FloatingLabelInput
            {...baseProps}
            rightIcon={icon}
            rightIconTooltip={iconTooltip}
            alignTooltip="end"
          />
        )
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
