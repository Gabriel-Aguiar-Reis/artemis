import { Button } from '@/src/components/ui/button'
import { FloatingLabelInput } from '@/src/components/ui/floating-label-input'
import { Label } from '@/src/components/ui/label'
import { Text } from '@/src/components/ui/text'
import { Stack } from 'expo-router'
import { LucideIcon } from 'lucide-react-native'
import { BaseSyntheticEvent } from 'react'
import {
  Control,
  Controller,
  ControllerRenderProps,
  FieldErrors,
  FieldValues,
  Path,
} from 'react-hook-form'
import { ScrollView, Switch, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
}

export function CategoryForm<T extends FieldValues>({
  title,
  onSubmit,
  errors,
  control,
  nameIcon: nameIcon,
  nameIconTooltip,
  submitLabel,
  alternate,
}: CategoryFormProps<T>) {
  const renderItem = (field: ControllerRenderProps<T>) => {
    const baseProps = {
      label: 'Nome da Categoria',
      placeholder: 'Ex. Documentos',
      error: errors?.name?.message as string,
      ...field,
    }

    if (!nameIcon) {
      return <FloatingLabelInput {...baseProps} />
    }

    if (alternate) {
      if (alternate.type === 'toSecret') {
        return (
          <FloatingLabelInput
            {...baseProps}
            rightIcon={nameIcon}
            alternateRightIcon={alternate.nameIcon}
            alternateToSecret={true}
            startSecreted={false}
          />
        )
      } else {
        return (
          <FloatingLabelInput
            {...baseProps}
            rightIcon={nameIcon}
            alternateRightIcon={alternate.nameIcon}
            alternateToDisabled={true}
            startDisabled={true}
          />
        )
      }
    }

    return (
      <FloatingLabelInput
        {...baseProps}
        rightIcon={nameIcon}
        rightIconTooltip={nameIconTooltip}
        alignTooltip="end"
      />
    )
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title }} />
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          <Controller
            control={control}
            name={'name' as Path<T>}
            rules={{ required: true }}
            render={(item) => renderItem(item.field)}
          />

          <View className="flex-row items-center">
            <Controller
              control={control}
              name={'isActive' as Path<T>}
              render={({ field: { onChange, value } }) => (
                <Switch
                  key={value ? 'on' : 'off'}
                  value={!!value}
                  onValueChange={onChange}
                />
              )}
            />
            <Label className="ml-2">Categoria Ativa</Label>
          </View>

          <Button onPress={onSubmit} className="mt-4">
            <Text>{submitLabel}</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
