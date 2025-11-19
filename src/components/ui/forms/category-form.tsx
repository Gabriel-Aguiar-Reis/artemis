import { Button } from '@/src/components/ui/button'
import { FloatingLabelInput } from '@/src/components/ui/floating-label-input'
import { Label } from '@/src/components/ui/label'
import { Text } from '@/src/components/ui/text'
import { Stack } from 'expo-router'
import { LucideIcon } from 'lucide-react-native'
import { BaseSyntheticEvent } from 'react'
import { Control, Controller, FieldErrors, FieldValues } from 'react-hook-form'
import { ScrollView, Switch, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type CategoryFormProps<T extends FieldValues> = {
  title: string
  onSubmit: (e?: BaseSyntheticEvent) => void
  errors: FieldErrors<T>
  control: Control<T>
  nameIcon?: LucideIcon
  nameIconTooltip?: string
  submitLabel: string
}

export function CategoryForm<T extends FieldValues>({
  title,
  onSubmit,
  errors,
  control,
  nameIcon: NameIcon,
  nameIconTooltip,
  submitLabel,
}: CategoryFormProps<T>) {
  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title }} />
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          <Controller
            control={control}
            name={'name' as any}
            rules={{ required: true }}
            render={({ field: { onChange, value, onBlur } }) => (
              <FloatingLabelInput
                label="Nome da Categoria"
                placeholder="Ex. Documentos"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                rightIcon={NameIcon ? NameIcon : undefined}
                error={errors?.name?.message as string}
                rightIconTooltip={nameIconTooltip}
                alignTooltip="end"
              />
            )}
          />

          <View className="flex-row items-center">
            <Controller
              control={control}
              name={'isActive' as any}
              render={({ field: { onChange, value } }) => (
                <Switch value={value} onValueChange={onChange} />
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
