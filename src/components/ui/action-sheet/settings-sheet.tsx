import { useLicense } from '@/src/application/hooks/license.hooks'
import { DefaultActionSheet } from '@/src/components/ui/action-sheet'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import { Toggle } from '@/src/components/ui/toggle'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {
  AlertCircle,
  CalendarClock,
  KeyRound,
  Monitor,
  Moon,
  RefreshCw,
  Sun,
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SheetManager, SheetProps } from 'react-native-actions-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const THEME_STORAGE_KEY = 'user-theme-preference'

type ThemePreference = 'light' | 'dark' | 'system'

export function SettingsSheet(props: SheetProps<'settings-sheet'>) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colorScheme, setColorScheme } = useColorScheme()
  const [themePreference, setThemePreference] =
    useState<ThemePreference>('system')

  const { data: license, isLoading } = useLicense()

  // Carregar preferência salva quando o sheet abre
  useEffect(() => {
    const loadThemePreference = async () => {
      const value = await AsyncStorage.getItem(THEME_STORAGE_KEY)
      if (value) {
        setThemePreference(value as ThemePreference)
      }
    }

    loadThemePreference()
  }, [])

  const handleThemeChange = async (theme: ThemePreference) => {
    setThemePreference(theme)
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme)

    if (theme === 'system') {
      // Definir como undefined faz o nativewind usar o tema do sistema
      setColorScheme(undefined as any)
    } else {
      setColorScheme(theme)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <DefaultActionSheet sheetProps={props}>
      <View style={{ paddingBottom: insets.bottom }}>
        <View className="gap-6 px-4 py-6 bg-background">
          <Text variant="h3">Configurações</Text>

          {/* Seção de Tema */}
          <View className="gap-3">
            <Text className="text-muted-foreground font-medium">Tema</Text>

            <View className="flex-row gap-2">
              <Toggle
                pressed={themePreference === 'light'}
                onPressedChange={() => handleThemeChange('light')}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Icon as={Sun} size={18} className="text-primary" />
                <Text>Claro</Text>
              </Toggle>

              <Toggle
                pressed={themePreference === 'dark'}
                onPressedChange={() => handleThemeChange('dark')}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Icon as={Moon} size={18} className="text-primary" />
                <Text>Escuro</Text>
              </Toggle>

              <Toggle
                pressed={themePreference === 'system'}
                onPressedChange={() => handleThemeChange('system')}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Icon as={Monitor} size={18} className="text-primary" />
                <Text>Sistema</Text>
              </Toggle>
            </View>
          </View>

          {/* Seção de Licença */}
          <View className="gap-3">
            <Text className="text-muted-foreground font-medium">Licença</Text>

            {isLoading ? (
              <View className="py-4 items-center">
                <ActivityIndicator />
              </View>
            ) : license?.isAdmin ? (
              // Visualização para Admin
              <View className="gap-3">
                <View className="border-green-600 bg-green-100 rounded-md dark:bg-green-950">
                  <Alert
                    icon={CalendarClock}
                    variant="default"
                    className="bg-transparent border-green-600 dark:border-green-600"
                    iconClassName="text-green-600"
                  >
                    <AlertTitle className="font-semibold text-green-800 dark:text-green-200">
                      Licença Vitalícia
                    </AlertTitle>
                    <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                      Válida até {formatDate(license.expirationDate)}
                    </AlertDescription>
                  </Alert>
                </View>

                <Button
                  variant="outline"
                  onPress={async () => {
                    await SheetManager.hide(props.sheetId)
                    router.push('/admin/generate-license')
                  }}
                  className="flex-row gap-2"
                >
                  <Icon as={KeyRound} size={20} className="text-foreground" />
                  <Text>Gerar Código de Licença</Text>
                </Button>
              </View>
            ) : (
              // Visualização para Usuário Comum
              <View className="gap-3">
                <View className="border-blue-600 bg-blue-50 rounded-md dark:bg-blue-950">
                  <Alert
                    icon={
                      license && license.getDaysRemaining() < 15
                        ? AlertCircle
                        : CalendarClock
                    }
                    variant={
                      license && license.getDaysRemaining() < 15
                        ? 'destructive'
                        : 'default'
                    }
                    className={
                      license && license.getDaysRemaining() < 15
                        ? 'bg-transparent border-destructive'
                        : 'border-blue-600 bg-transparent'
                    }
                    iconClassName={
                      license && license.getDaysRemaining() < 15
                        ? 'text-destructive'
                        : 'text-blue-600 bg-transparent'
                    }
                  >
                    <AlertTitle
                      className={
                        license && license.getDaysRemaining() < 15
                          ? 'font-semibold'
                          : 'font-semibold text-blue-800 dark:text-blue-200'
                      }
                    >
                      Expira em {license?.getDaysRemaining() || 0} dias
                    </AlertTitle>
                    <AlertDescription
                      className={
                        license && license.getDaysRemaining() < 15
                          ? 'text-sm'
                          : 'text-sm text-blue-700 dark:text-blue-300'
                      }
                    >
                      Válida até{' '}
                      {license ? formatDate(license.expirationDate) : '-'}
                    </AlertDescription>
                  </Alert>
                </View>

                <Button
                  variant="outline"
                  onPress={async () => {
                    await SheetManager.hide(props.sheetId)
                    router.push('/license/renew')
                  }}
                  className="flex-row gap-2"
                >
                  <Icon as={RefreshCw} size={20} className="text-foreground" />
                  <Text>Solicitar Renovação</Text>
                </Button>
              </View>
            )}
          </View>

          <Button
            variant="outline"
            onPress={async () => await SheetManager.hide(props.sheetId)}
            className="w-full"
          >
            <Text>Fechar</Text>
          </Button>
        </View>
      </View>
    </DefaultActionSheet>
  )
}
