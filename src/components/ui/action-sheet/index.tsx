import { THEME } from '@/src/lib/theme'
import { useColorScheme } from 'nativewind'
import { ReactNode } from 'react'
import ActionSheet, { SheetProps, Sheets } from 'react-native-actions-sheet'

export type CustomActionSheetProps<T extends keyof Sheets> = {
  sheetProps: SheetProps<T>
  children: ReactNode
}

export function DefaultActionSheet<T extends keyof Sheets>(
  props: CustomActionSheetProps<T>
) {
  const { colorScheme } = useColorScheme()
  const palette = THEME[colorScheme === 'dark' ? 'dark' : 'light']
  return (
    <ActionSheet
      id={props.sheetProps.sheetId}
      gestureEnabled={true}
      // Sheets sit on the overlay layer (popover surface), above cards
      containerStyle={{ backgroundColor: palette.popover }}
      overlayColor="#000"
      defaultOverlayOpacity={colorScheme === 'dark' ? 0.6 : 0.4}
    >
      {props.children}
    </ActionSheet>
  )
}
