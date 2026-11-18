import { errorLogHooks } from '@/src/application/hooks/error-log.hooks'
import {
  buildLogDumpJsonString,
  clearAllLogs,
  saveLogDumpAndShare,
} from '@/src/application/services/error-logging.service'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import { ErrorLog } from '@/src/domain/entities/error-log/error-log.entity'
import * as ClipboardAPI from 'expo-clipboard'
import { Stack } from 'expo-router'
import {
  AlertCircle,
  Bug,
  Clipboard,
  Download,
  Info,
  Trash2,
  TriangleAlert,
} from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

const LEVEL_ICONS = {
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
}

const LEVEL_COLORS = {
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
}

export default function LogsViewerScreen() {
  const [isExporting, setIsExporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const { data: logs, isLoading } = errorLogHooks.getAllLogs()

  const handleExportToFile = async () => {
    setIsExporting(true)
    try {
      await saveLogDumpAndShare()
      Toast.show({
        type: 'success',
        text1: 'Logs exportados',
        text2: 'Compartilhe o arquivo para análise',
      })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao exportar',
        text2:
          error instanceof Error ? error.message : 'Falha ao exportar logs',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyToClipboard = async () => {
    setIsExporting(true)
    try {
      const json = await buildLogDumpJsonString()
      await ClipboardAPI.setStringAsync(json)
      Toast.show({
        type: 'success',
        text1: 'Logs copiados',
        text2: 'JSON copiado para a área de transferência',
      })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao copiar',
        text2: error instanceof Error ? error.message : 'Falha ao copiar logs',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleClearAllLogs = async () => {
    setIsClearing(true)
    try {
      await clearAllLogs()
      Toast.show({
        type: 'success',
        text1: 'Logs limpos',
        text2: 'Todos os logs foram removidos',
      })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao limpar',
        text2: error instanceof Error ? error.message : 'Falha ao limpar logs',
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Logs do Sistema', headerShown: true }} />
      <ScrollView className="flex-1">
        <View className="gap-6 p-4">
          <Text variant="h3">Visualizador de Logs</Text>

          <Alert icon={Bug} variant="default">
            <AlertTitle>Sistema de Logmetria</AlertTitle>
            <AlertDescription className="text-xs">
              Logs de erros, avisos e informações são capturados automaticamente
              e armazenados por até 7 dias. Exporte para análise ou
              compartilhamento.
            </AlertDescription>
          </Alert>

          <View className="gap-3">
            <Text variant="h4">Exportar Logs</Text>

            <Button
              variant="outline"
              onPress={handleExportToFile}
              disabled={isExporting}
              className="flex-row gap-2"
            >
              <Icon as={Download} size={20} className="text-foreground" />
              <Text>
                {isExporting ? 'Exportando...' : 'Exportar para Arquivo JSON'}
              </Text>
            </Button>

            <Button
              variant="outline"
              onPress={handleCopyToClipboard}
              disabled={isExporting}
              className="flex-row gap-2"
            >
              <Icon as={Clipboard} size={20} className="text-foreground" />
              <Text>
                {isExporting
                  ? 'Copiando...'
                  : 'Copiar JSON para Área de Transferência'}
              </Text>
            </Button>
          </View>

          <View className="gap-3">
            <Text variant="h4">Gerenciar Logs</Text>

            <Button
              variant="destructive"
              onPress={handleClearAllLogs}
              disabled={isClearing}
              className="flex-row gap-2"
            >
              <Icon
                as={Trash2}
                size={20}
                className="text-destructive-foreground"
              />
              <Text className="text-destructive-foreground">
                {isClearing ? 'Limpando...' : 'Limpar Todos os Logs'}
              </Text>
            </Button>
          </View>

          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text variant="h4">Logs Recentes</Text>
              <Text className="text-muted-foreground text-sm">
                {logs?.length || 0} registro(s)
              </Text>
            </View>

            {isLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator />
                <Text className="mt-2 text-muted-foreground">
                  Carregando logs...
                </Text>
              </View>
            ) : logs && logs.length > 0 ? (
              <View className="gap-2">
                {logs
                  .sort((a: ErrorLog, b: ErrorLog) => b.timestamp - a.timestamp)
                  .slice(0, 50)
                  .map((log: ErrorLog) => {
                    const LogIcon = LEVEL_ICONS[log.level]
                    const levelColor = LEVEL_COLORS[log.level]

                    return (
                      <View
                        key={log.id}
                        className="border border-border rounded-lg p-3 gap-2"
                      >
                        <View className="flex-row items-center gap-2">
                          <Icon as={LogIcon} size={16} className={levelColor} />
                          <Text
                            className={`font-semibold uppercase text-xs ${levelColor}`}
                          >
                            {log.level}
                          </Text>
                          <Text className="text-xs text-muted-foreground flex-1 text-right">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </Text>
                        </View>

                        <Text className="text-sm">{log.message}</Text>

                        {log.context && (
                          <Text className="text-xs text-muted-foreground">
                            📍 {log.context}
                          </Text>
                        )}

                        {log.stackTrace && (
                          <View className="bg-muted rounded p-2 mt-1">
                            <Text className="text-xs font-mono text-muted-foreground">
                              {log.stackTrace.split('\n')[0]}
                            </Text>
                          </View>
                        )}
                      </View>
                    )
                  })}
              </View>
            ) : (
              <View className="py-8 items-center">
                <Icon
                  as={Bug}
                  size={48}
                  className="text-muted-foreground mb-2"
                />
                <Text className="text-muted-foreground">
                  Nenhum log registrado
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
