import { DefaultActionSheet } from '@/src/components/ui/action-sheet'
import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import { LucideIcon } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { SheetManager, SheetProps } from 'react-native-actions-sheet'

export type OptionItem = {
  label: string
  icon?: LucideIcon
  onPress: () => void
  destructive?: boolean
}

export type OptionsSheetPayload = {
  title?: string
  options: OptionItem[]
}

export function OptionsSheet(props: SheetProps<'options-sheet'>) {
  const payload = props.payload as OptionsSheetPayload | undefined

  const handleOptionPress = async (option: OptionItem) => {
    option.onPress()
    await SheetManager.hide(props.sheetId)
  }

  return (
    <DefaultActionSheet sheetProps={props}>
      <View className="gap-4 px-4 py-6 bg-background">
        {payload?.title && (
          <Text variant="h3" className="mb-2">
            {payload.title}
          </Text>
        )}

        <View className="gap-2 items-center">
          {payload?.options.map((option, index) => (
            <Pressable
              key={index}
              onPress={() => handleOptionPress(option)}
              className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-4 active:bg-accent"
            >
              {option.icon && (
                <Icon
                  as={option.icon}
                  className={
                    option.destructive ? 'text-destructive' : 'text-foreground'
                  }
                />
              )}
              <Text
                className={`flex-1 ${option.destructive ? 'text-destructive' : 'text-foreground'}`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          variant="outline"
          onPress={async () => await SheetManager.hide(props.sheetId)}
          className="w-full"
        >
          <Text>Cancelar</Text>
        </Button>
      </View>
    </DefaultActionSheet>
  )
}
