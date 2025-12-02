import {
  DatePickerSheet,
  DatePickerSheetPayload,
} from '@/src/components/ui/action-sheet/date-picker-sheet'
import {
  OptionsSheet,
  OptionsSheetPayload,
} from '@/src/components/ui/action-sheet/options-sheet'
import { registerSheet, SheetDefinition } from 'react-native-actions-sheet'

registerSheet('options-sheet', OptionsSheet)
registerSheet('date-picker-sheet', DatePickerSheet)

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'options-sheet': SheetDefinition<{
      payload: OptionsSheetPayload
    }>
    'date-picker-sheet': SheetDefinition<{
      payload: DatePickerSheetPayload
    }>
  }
}
