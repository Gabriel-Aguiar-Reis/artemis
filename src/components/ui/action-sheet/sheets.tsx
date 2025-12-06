import {
  DatePickerRangeSheet,
  DatePickerRangeSheetPayload,
} from '@/src/components/ui/action-sheet/date-picker-range-sheet'
import {
  DatePickerSheet,
  DatePickerSheetPayload,
} from '@/src/components/ui/action-sheet/date-picker-sheet'
import {
  OptionsSheet,
  OptionsSheetPayload,
} from '@/src/components/ui/action-sheet/options-sheet'
import { SettingsSheet } from '@/src/components/ui/action-sheet/settings-sheet'
import { registerSheet, SheetDefinition } from 'react-native-actions-sheet'

registerSheet('options-sheet', OptionsSheet)
registerSheet('date-picker-sheet', DatePickerSheet)
registerSheet('date-picker-range-sheet', DatePickerRangeSheet)
registerSheet('settings-sheet', SettingsSheet)

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'options-sheet': SheetDefinition<{
      payload: OptionsSheetPayload
    }>
    'date-picker-sheet': SheetDefinition<{
      payload: DatePickerSheetPayload
    }>
    'date-picker-range-sheet': SheetDefinition<{
      payload: DatePickerRangeSheetPayload
    }>
    'settings-sheet': SheetDefinition
  }
}
