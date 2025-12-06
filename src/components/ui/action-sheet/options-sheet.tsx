import { DefaultActionSheet } from '@/src/components/ui/action-sheet'
import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import { WhatsAppIcon } from '@/src/components/ui/whatsapp-icon'
import { cn } from '@/src/lib/utils'
import { LucideIcon } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { SheetManager, SheetProps } from 'react-native-actions-sheet'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type OptionItem = {
  label: string
  icon?: LucideIcon
  onPress: () => void
  destructive?: boolean
  isWhatsApp?: boolean
}

export type OptionsSheetPayload = {
  title?: string
  options: OptionItem[]
}

export function OptionsSheet(props: SheetProps<'options-sheet'>) {
  const payload = props.payload as OptionsSheetPayload | undefined
  const insets = useSafeAreaInsets()

  const handleOptionPress = async (option: OptionItem) => {
    option.onPress()
    await SheetManager.hide(props.sheetId)
  }

  return (
    <DefaultActionSheet sheetProps={props}>
      <View style={{ paddingBottom: insets.bottom }}>
        <View className="gap-4 px-4 py-6 bg-background">
          {payload?.title && (
            <Text variant="h3" className="mb-2">
              {payload.title}
            </Text>
          )}

          <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
            {payload?.options.map((option, index) => {
              return (
                <Pressable
                  key={index}
                  onPress={() => handleOptionPress(option)}
                  className={cn(
                    'flex-row items-center gap-3 rounded-lg border border-border bg-card p-4 active:bg-accent mb-2',
                    option.isWhatsApp &&
                      'bg-green-100 dark:bg-green-950 border-green-600',
                    option.destructive && 'border-destructive bg-destructive/10'
                  )}
                >
                  {option.icon ? (
                    <Icon
                      as={option.icon}
                      size={20}
                      className={
                        option.destructive
                          ? 'text-destructive'
                          : 'text-foreground'
                      }
                    />
                  ) : option.isWhatsApp ? (
                    <WhatsAppIcon size={20} className="text-green-600" />
                  ) : null}

                  <Text
                    className={cn(
                      'flex-1',
                      option.destructive
                        ? 'text-destructive'
                        : 'text-foreground',
                      option.isWhatsApp && 'text-green-600'
                    )}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <Button
            variant="outline"
            onPress={async () => await SheetManager.hide(props.sheetId)}
            className="w-full"
          >
            <Text>Cancelar</Text>
          </Button>
        </View>
      </View>
    </DefaultActionSheet>
  )
}
