import { useLicense } from '@/src/application/hooks/license.hooks'
import { saveLogDumpAndShare } from '@/src/application/services/error-logging.service'
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
  Bug,
  CalendarClock,
  Database,
  FileSpreadsheet,
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
import Toast from 'react-native-toast-message'

const THEME_STORAGE_KEY = 'user-theme-preference'

type ThemePreference = 'light' | 'dark' | 'system'

export function SettingsSheet(props: SheetProps<'settings-sheet'>) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colorScheme, setColorScheme } = useColorScheme()
  const [themePreference, setThemePreference] =
    useState<ThemePreference>('system')
  const [isExportingLogs, setIsExportingLogs] = useState(false)

  const { data: license, isLoading } = useLicense()

  // Load the saved preference when the sheet opens
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
      // Setting to undefined makes nativewind use the system theme
      setColorScheme(undefined as any)
    } else {
      setColorScheme(theme)
    }
  }

  const handleExportLogs = async () => {
    setIsExportingLogs(true)
    try {
      await saveLogDumpAndShare()
      Toast.show({
        type: 'success',
        text1: 'Logs exportados com sucesso',
        text2: 'Compartilhe o arquivo para análise',
      })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao exportar logs',
        text2: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setIsExportingLogs(false)
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

          {/* Theme section */}
          <View className="gap-3">
            <Text className="text-muted-foreground font-medium">Tema</Text>

            <View className="flex-row gap-2">
              <Toggle
                pressed={themePreference === 'light'}
                onPressedChange={() => handleThemeChange('light')}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Icon as={Sun} size={18} className="text-muted-foreground" />
                <Text>Claro</Text>
              </Toggle>

              <Toggle
                pressed={themePreference === 'dark'}
                onPressedChange={() => handleThemeChange('dark')}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Icon as={Moon} size={18} className="text-muted-foreground" />
                <Text>Escuro</Text>
              </Toggle>

              <Toggle
                pressed={themePreference === 'system'}
                onPressedChange={() => handleThemeChange('system')}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Icon
                  as={Monitor}
                  size={18}
                  className="text-muted-foreground"
                />
                <Text>Sistema</Text>
              </Toggle>
            </View>
          </View>

          {/* License section */}
          <View className="gap-3">
            <Text className="text-muted-foreground font-medium">Licença</Text>

            {isLoading ? (
              <View className="py-4 items-center">
                <ActivityIndicator />
              </View>
            ) : license?.isAdmin ? (
              // Admin view
              <View className="gap-3">
                <View className="border-success bg-success-subtle rounded-md">
                  <Alert
                    icon={CalendarClock}
                    variant="default"
                    className="bg-transparent border-success"
                    iconClassName="text-success"
                  >
                    <AlertTitle className="font-semibold text-success">
                      Licença Vitalícia
                    </AlertTitle>
                    <AlertDescription className="text-sm text-success">
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

                <Button
                  variant="outline"
                  onPress={async () => {
                    await SheetManager.hide(props.sheetId)
                    router.push('/admin/data-transfer' as any)
                  }}
                  className="flex-row gap-2"
                >
                  <Icon as={Database} size={20} className="text-foreground" />
                  <Text>Importar/Exportar Dados</Text>
                </Button>

                <Button
                  variant="outline"
                  onPress={async () => {
                    await SheetManager.hide(props.sheetId)
                    router.push('/admin/data-dump' as any)
                  }}
                  className="flex-row gap-2"
                >
                  <Icon
                    as={FileSpreadsheet}
                    size={20}
                    className="text-foreground"
                  />
                  <Text>Backup (Dump JSON)</Text>
                </Button>

                <Button
                  variant="outline"
                  onPress={handleExportLogs}
                  disabled={isExportingLogs}
                  className="flex-row gap-2"
                >
                  <Icon as={Bug} size={20} className="text-foreground" />
                  <Text>
                    {isExportingLogs ? 'Exportando...' : 'Logs (Dump JSON)'}
                  </Text>
                </Button>

                <Button
                  variant="outline"
                  onPress={async () => {
                    await SheetManager.hide(props.sheetId)
                    router.push('/admin/logs-viewer' as any)
                  }}
                  className="flex-row gap-2"
                >
                  <Icon as={Bug} size={20} className="text-foreground" />
                  <Text>Visualizar Logs</Text>
                </Button>
              </View>
            ) : (
              // Regular user view
              <View className="gap-3">
                <View className="border-info bg-info-subtle rounded-md">
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
                        : 'border-info bg-transparent'
                    }
                    iconClassName={
                      license && license.getDaysRemaining() < 15
                        ? 'text-destructive'
                        : 'text-info bg-transparent'
                    }
                  >
                    <AlertTitle
                      className={
                        license && license.getDaysRemaining() < 15
                          ? 'font-semibold'
                          : 'font-semibold text-info'
                      }
                    >
                      Expira em {license?.getDaysRemaining() || 0} dias
                    </AlertTitle>
                    <AlertDescription
                      className={
                        license && license.getDaysRemaining() < 15
                          ? 'text-sm'
                          : 'text-sm text-info'
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
