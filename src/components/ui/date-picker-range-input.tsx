import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import { cn } from '@/src/lib/utils'
import { Calendar } from 'lucide-react-native'
import * as React from 'react'
import { useEffect, useRef } from 'react'
import { Animated, Easing, Pressable, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'

type DatePickerRangeInputProps = {
  value: { startDate: Date | undefined; endDate: Date | undefined }
  onDateChange: (payload: { startDate: Date; endDate: Date }) => void
  label?: string
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  error?: string
}

export function DatePickerRangeInput({
  value,
  onDateChange,
  label = 'Período',
  placeholder = 'Selecione um intervalo de datas',
  minDate,
  maxDate,
  error,
}: DatePickerRangeInputProps) {
  const hasValue = !!value
  const shouldFloat = hasValue
  const animated = useRef(new Animated.Value(shouldFloat ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(animated, {
      toValue: shouldFloat ? 1 : 0,
      duration: 80,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start()
  }, [shouldFloat])

  const labelStyle = {
    position: 'absolute' as const,
    left: 8,
    paddingHorizontal: 2,
    zIndex: 10,
    top: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [-8, -8],
    }),
    fontSize: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [12, 12],
    }),
  }

  const handleOpenDatePicker = async () => {
    await SheetManager.show('date-picker-range-sheet', {
      payload: {
        title: label,
        initialStartDate: value.startDate,
        initialEndDate: value.endDate,
        minDate,
        maxDate,
        onConfirm: (startDate, endDate) => {
          onDateChange({ startDate, endDate })
        },
      },
    })
  }

  const formattedDate =
    value.startDate && value.endDate
      ? `${value.startDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })} - ${value.endDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}`
      : placeholder

  return (
    <View className="relative">
      {label && (
        <Animated.Text
          style={labelStyle}
          numberOfLines={1}
          className="bg-background text-muted-foreground"
        >
          {label}
        </Animated.Text>
      )}

      <Pressable
        onPress={handleOpenDatePicker}
        className={cn(
          'flex-row items-center justify-between h-12 px-4 rounded-md',
          'border border-input bg-background',
          'active:bg-accent',
          error && 'border-destructive'
        )}
      >
        <View className="flex-row items-center gap-2 flex-1">
          <Icon as={Calendar} size={20} className="text-muted-foreground" />
          <Text
            className={cn('flex-1', !value && 'text-muted-foreground')}
            numberOfLines={1}
          >
            {formattedDate}
          </Text>
        </View>
      </Pressable>

      {error && <Text className="text-sm text-destructive mt-1">{error}</Text>}
    </View>
  )
}
