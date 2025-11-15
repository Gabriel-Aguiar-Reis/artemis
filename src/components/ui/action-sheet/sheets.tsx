import {
  ConfirmDeleteSheet,
  ConfirmDeleteSheetPayload,
} from '@/src/components/ui/action-sheet/confirm-delete-sheet'
import {
  FilterSheet,
  FilterSheetPayload,
} from '@/src/components/ui/action-sheet/filter-sheet'
import {
  OptionsSheet,
  OptionsSheetPayload,
} from '@/src/components/ui/action-sheet/options-sheet'
import { registerSheet, SheetDefinition } from 'react-native-actions-sheet'

console.log('Registrando sheets...')
console.log('ConfirmDeleteSheet:', ConfirmDeleteSheet)
console.log('OptionsSheet:', OptionsSheet)
console.log('FilterSheet:', FilterSheet)

registerSheet('confirm-delete-sheet', ConfirmDeleteSheet)
registerSheet('filter-sheet', FilterSheet)
registerSheet('options-sheet', OptionsSheet)

console.log('Sheets registrados com sucesso!')

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'confirm-delete-sheet': SheetDefinition<{
      payload: ConfirmDeleteSheetPayload
    }>
    'filter-sheet': SheetDefinition<{
      payload: FilterSheetPayload
    }>
    'options-sheet': SheetDefinition<{
      payload: OptionsSheetPayload
    }>
  }
}
