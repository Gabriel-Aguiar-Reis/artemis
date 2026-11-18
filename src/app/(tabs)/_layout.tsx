import { Icon } from '@/src/components/ui/icon'
import { saveLastTab } from '@/src/lib/last-tab'
import { THEME } from '@/src/lib/theme'
import { Tabs } from 'expo-router'
import {
  ClipboardList,
  FolderTree,
  LucideIcon,
  MapPin,
  Package,
  Users,
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { View } from 'react-native'

type Palette = (typeof THEME)['light']

function TabIcon({ as, color }: { as: LucideIcon; color: string }) {
  return <Icon as={as} size={22} color={color} />
}

/** The itinerary is the app's main screen: centered and raised. */
function ItineraryTabIcon({
  focused,
  palette,
}: {
  focused: boolean
  palette: Palette
}) {
  return (
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        marginTop: -18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? palette.primary : palette.secondary,
        borderWidth: 4,
        borderColor: palette.card,
      }}
    >
      <Icon
        as={MapPin}
        size={24}
        color={focused ? palette.primaryForeground : palette.mutedForeground}
      />
    </View>
  )
}

export default function TabsLayout() {
  const { colorScheme } = useColorScheme()
  const palette = THEME[colorScheme === 'dark' ? 'dark' : 'light']

  return (
    <Tabs
      // Android back from any tab goes to the itinerary (the main screen),
      // and from there exits the app (default was "first tab" = Clientes)
      initialRouteName="itinerary"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.mutedForeground,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
      // Persist the active tab so a cold start reopens it
      screenListeners={({ route }) => ({
        focus: () => saveLastTab(route.name),
      })}
    >
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color }) => <TabIcon as={Users} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color }) => <TabIcon as={Package} color={color} />,
        }}
      />
      <Tabs.Screen
        name="itinerary"
        options={{
          title: 'Itinerário',
          tabBarIcon: ({ focused }) => (
            <ItineraryTabIcon focused={focused} palette={palette} />
          ),
        }}
      />
      <Tabs.Screen
        name="work-orders"
        options={{
          title: 'OS',
          tabBarAccessibilityLabel: 'Ordens de Serviço',
          tabBarIcon: ({ color }) => (
            <TabIcon as={ClipboardList} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categorias',
          tabBarIcon: ({ color }) => <TabIcon as={FolderTree} color={color} />,
        }}
      />
    </Tabs>
  )
}
