import { DefaultActionSheet } from '@/src/components/ui/action-sheet'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { View } from 'react-native'
import { SheetManager, SheetProps } from 'react-native-actions-sheet'

export type ConfirmDeleteSheetPayload = {
  title?: string
  message?: string
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmDeleteSheet(props: SheetProps<'confirm-delete-sheet'>) {
  const payload = props.payload as ConfirmDeleteSheetPayload | undefined

  const handleConfirm = async () => {
    payload?.onConfirm()
    await SheetManager.hide(props.sheetId)
  }

  const handleCancel = async () => {
    payload?.onCancel?.()
    await SheetManager.hide(props.sheetId)
  }

  return (
    <DefaultActionSheet sheetProps={props}>
      <View className="gap-4 px-4 py-6">
        <View className="gap-2">
          <Text variant="h3" className="text-center">
            {payload?.title || 'Confirmar exclusão'}
          </Text>
          <Text className="text-center text-muted-foreground">
            {payload?.message || 'Deseja realmente excluir este item?'}
          </Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="outline" onPress={handleCancel} className="w-full">
              <Text>Cancelar</Text>
            </Button>
          </View>
          <View className="flex-1">
            <Button
              variant="destructive"
              onPress={handleConfirm}
              className="w-full"
            >
              <Text>Excluir</Text>
            </Button>
          </View>
        </View>
      </View>
    </DefaultActionSheet>
  )
}
