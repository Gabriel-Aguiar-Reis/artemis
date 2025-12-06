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
  return (
    <ActionSheet
      id={props.sheetProps.sheetId}
      gestureEnabled={true}
      containerStyle={{
        backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#fff',
      }}
      overlayColor={colorScheme === 'dark' ? '#4d4d4d' : '#000'}
    >
      {props.children}
    </ActionSheet>
  )
}
