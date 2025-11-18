import {
  OptionsSheet,
  OptionsSheetPayload,
} from '@/src/components/ui/action-sheet/options-sheet'
import { registerSheet, SheetDefinition } from 'react-native-actions-sheet'

registerSheet('options-sheet', OptionsSheet)

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'options-sheet': SheetDefinition<{
      payload: OptionsSheetPayload
    }>
  }
}
