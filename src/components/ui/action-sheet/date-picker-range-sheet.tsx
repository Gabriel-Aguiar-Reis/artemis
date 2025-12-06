import { DefaultActionSheet } from '@/src/components/ui/action-sheet'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { useState } from 'react'
import { View } from 'react-native'
import { SheetManager, SheetProps } from 'react-native-actions-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import DateTimePicker, {
  DateType,
  useDefaultClassNames,
} from 'react-native-ui-datepicker'

export type DatePickerRangeSheetPayload = {
  title?: string
  initialStartDate?: Date
  initialEndDate?: Date
  minDate?: Date
  maxDate?: Date
  onConfirm: (startDate: Date, endDate: Date) => void
}

export function DatePickerRangeSheet(
  props: SheetProps<'date-picker-range-sheet'>
) {
  const payload = props.payload as DatePickerRangeSheetPayload | undefined
  const insets = useSafeAreaInsets()

  const defaultClassNames = useDefaultClassNames()
  const [selectedStart, setSelectedStart] = useState<DateType>(
    payload?.initialStartDate
  )
  const [selectedEnd, setSelectedEnd] = useState<DateType>(
    payload?.initialEndDate
  )

  const handleConfirm = async () => {
    if (selectedStart && selectedEnd && payload?.onConfirm) {
      payload.onConfirm(selectedStart as Date, selectedEnd as Date)
    }
    await SheetManager.hide(props.sheetId)
  }

  return (
    <DefaultActionSheet sheetProps={props}>
      <View style={{ paddingBottom: insets.bottom }}>
        <View className="gap-4 px-4 py-6 bg-background">
          {payload?.title && (
            <Text variant="h3" className="mb-2">
              {payload.title}
            </Text>
          )}

          <DateTimePicker
            mode="range"
            startDate={selectedStart}
            endDate={selectedEnd}
            onChange={({ startDate, endDate }) => {
              setSelectedStart(startDate)
              setSelectedEnd(endDate)
            }}
            classNames={{ ...defaultClassNames }}
            minDate={payload?.minDate}
            maxDate={payload?.maxDate}
            showOutsideDays
            timeZone="America/Sao_Paulo"
            locale="pt"
          />

          <Button
            onPress={handleConfirm}
            disabled={!selectedStart || !selectedEnd}
          >
            <Text>Confirmar</Text>
          </Button>
          <Button
            variant="outline"
            onPress={async () => await SheetManager.hide(props.sheetId)}
            className="w-full"
          >
            <Text>Cancelar</Text>
          </Button>
        </View>
      </View>
    </DefaultActionSheet>
  )
}
