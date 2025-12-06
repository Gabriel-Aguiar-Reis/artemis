import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { LucideIcon } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { SheetManager } from 'react-native-actions-sheet'

type ButtonSettingsProps = {
  icon: LucideIcon
  color?: string
}

export const ButtonSettings = ({ color, icon }: ButtonSettingsProps) => {
  const handlePress = async () => {
    await SheetManager.show('settings-sheet')
  }
  const { colorScheme } = useColorScheme()
  return (
    <Button onPress={handlePress} size="icon" variant="outline">
      <Icon
        as={icon}
        size={24}
        color={color || (colorScheme === 'dark' ? 'white' : undefined)}
      />
    </Button>
  )
}
