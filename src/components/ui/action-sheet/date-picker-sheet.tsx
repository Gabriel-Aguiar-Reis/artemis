import { DefaultActionSheet } from '@/src/components/ui/action-sheet'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { useState } from 'react'
import { View } from 'react-native'
import { SheetManager, SheetProps } from 'react-native-actions-sheet'
import DateTimePicker, {
  DateType,
  useDefaultClassNames,
} from 'react-native-ui-datepicker'

export type DatePickerSheetPayload = {
  title?: string
  initialDate?: Date
  minDate?: Date
  maxDate?: Date
  onConfirm: (date: Date) => void
}

export function DatePickerSheet(props: SheetProps<'date-picker-sheet'>) {
  const payload = props.payload as DatePickerSheetPayload | undefined

  const defaultClassNames = useDefaultClassNames()
  const [selected, setSelected] = useState<DateType>(payload?.initialDate)

  const handleConfirm = async () => {
    if (selected && payload?.onConfirm) {
      payload.onConfirm(selected as Date)
    }
    await SheetManager.hide(props.sheetId)
  }

  return (
    <DefaultActionSheet sheetProps={props}>
      <View className="gap-4 px-4 py-6 bg-background">
        {payload?.title && (
          <Text variant="h3" className="mb-2">
            {payload.title}
          </Text>
        )}

        <DateTimePicker
          mode="single"
          date={selected}
          onChange={({ date }) => setSelected(date)}
          classNames={{ ...defaultClassNames }}
          minDate={payload?.minDate}
          maxDate={payload?.maxDate}
          showOutsideDays
          timeZone="America/Sao_Paulo"
          locale="pt"
        />

        <Button onPress={handleConfirm} disabled={!selected}>
          <Text>Confirmar</Text>
        </Button>
        <Button
          variant="outline"
          onPress={async () => await SheetManager.hide(props.sheetId)}
          className="w-full mb-8"
        >
          <Text>Cancelar</Text>
        </Button>
      </View>
    </DefaultActionSheet>
  )
}
