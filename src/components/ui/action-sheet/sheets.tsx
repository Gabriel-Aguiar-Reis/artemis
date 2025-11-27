import {
  CustomerOptionsSheet,
  CustomerOptionsSheetPayload,
} from '@/src/components/ui/action-sheet/customer-options-sheet'
import {
  OptionsSheet,
  OptionsSheetPayload,
} from '@/src/components/ui/action-sheet/options-sheet'
import { registerSheet, SheetDefinition } from 'react-native-actions-sheet'

registerSheet('options-sheet', OptionsSheet)
registerSheet('customer-options-sheet', CustomerOptionsSheet)

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'options-sheet': SheetDefinition<{
      payload: OptionsSheetPayload
    }>
    'customer-options-sheet': SheetDefinition<{
      payload: CustomerOptionsSheetPayload
    }>
  }
}
