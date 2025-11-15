import { DefaultActionSheet } from '@/src/components/ui/action-sheet'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { View } from 'react-native'
import { SheetManager, SheetProps } from 'react-native-actions-sheet'

export type FilterSheetPayload = {
  currentFilters?: Record<string, any>
  onApplyFilters: (filters: Record<string, any>) => void
}

export function FilterSheet(props: SheetProps<'filter-sheet'>) {
  const payload = props.payload as FilterSheetPayload | undefined

  const handleApply = async () => {
    // TODO: Aplicar lógica de filtros reais
    payload?.onApplyFilters(payload.currentFilters || {})
    await SheetManager.hide(props.sheetId)
  }

  const handleReset = async () => {
    payload?.onApplyFilters({})
    await SheetManager.hide(props.sheetId)
  }

  return (
    <DefaultActionSheet sheetProps={props}>
      <View className="gap-4 px-4 py-6">
        <Text variant="h3">Filtros</Text>

        {/* TODO: Adicionar campos de filtro */}
        <View className="gap-3">
          <Text className="text-muted-foreground">
            Adicione seus campos de filtro personalizados aqui
          </Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="outline" onPress={handleReset} className="w-full">
              <Text>Limpar</Text>
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={handleApply} className="w-full">
              <Text>Aplicar</Text>
            </Button>
          </View>
        </View>
      </View>
    </DefaultActionSheet>
  )
}
