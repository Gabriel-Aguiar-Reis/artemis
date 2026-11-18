import { ButtonSettings } from '@/src/components/ui/button-settings'
import { Stack } from 'expo-router'
import { Settings } from 'lucide-react-native'
import { Platform, View } from 'react-native'

type TabStackProps = {
  /** Title of the tab's root screen (index) */
  title: string
  /** Other screens of this tab that keep the bottom bar visible */
  screens?: { name: string; title?: string }[]
}

/**
 * Navigation stack of a bottom tab. The root screen gets the settings button
 * (the old home screen with it no longer exists). Forms are registered in the
 * root stack instead, so they open above the tab bar.
 */
export function TabStack({ title, screens = [] }: TabStackProps) {
  return (
    <Stack
      screenOptions={{
        animation:
          Platform.OS === 'ios' ? 'ios_from_right' : 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title,
          headerLeft: () => (
            <View className="mr-3">
              <ButtonSettings icon={Settings} />
            </View>
          ),
        }}
      />
      {screens.map((s) => (
        <Stack.Screen
          key={s.name}
          name={s.name}
          options={s.title ? { title: s.title } : undefined}
        />
      ))}
    </Stack>
  )
}
