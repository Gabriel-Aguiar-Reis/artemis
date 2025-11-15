import { useColorScheme } from 'nativewind'
import ActionSheet, { SheetProps, Sheets } from 'react-native-actions-sheet'

export type CustomActionSheetProps<T extends keyof Sheets = any> = {
  sheetProps: SheetProps<T>
  children: React.ReactNode
}

export function DefaultActionSheet(props: CustomActionSheetProps) {
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
