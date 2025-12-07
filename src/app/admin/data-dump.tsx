import {
  buildDumpJsonString,
  importDumpFromJsonString,
  importDumpFromPickedFile,
  pickDumpJson,
} from '@/src/application/services/dump.service'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import * as ClipboardAPI from 'expo-clipboard'
import { Stack } from 'expo-router'
import {
  Clipboard,
  Download,
  FileSpreadsheet,
  Upload,
} from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function DataDumpScreen() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [dumpPreview, setDumpPreview] = useState<string>('')

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const json = await buildDumpJsonString()
      setDumpPreview(json)
      await ClipboardAPI.setStringAsync(json)
      Toast.show({
        type: 'success',
        text1: 'Dump gerado',
        text2: 'Conteúdo copiado para a área de transferência',
      })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao exportar',
        text2: error instanceof Error ? error.message : 'Falha ao gerar dump',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportFromFile = async () => {
    setIsImporting(true)
    try {
      const uri = await pickDumpJson()
      if (!uri) {
        setIsImporting(false)
        return
      }
      const result = await importDumpFromPickedFile(uri)
      Toast.show({
        type: 'success',
        text1: 'Importação concluída',
        text2: `Versão ${result.version} • ${new Date(result.createdAt).toLocaleString()}`,
      })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro na importação',
        text2:
          error instanceof Error
            ? error.message
            : 'Não foi possível importar o dump',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportFromClipboard = async () => {
    setIsImporting(true)
    try {
      const text = await ClipboardAPI.getStringAsync()
      if (!text) {
        throw new Error('A área de transferência está vazia')
      }
      const result = await importDumpFromJsonString(text)
      Toast.show({
        type: 'success',
        text1: 'Importação concluída',
        text2: `Versão ${result.version} • ${new Date(result.createdAt).toLocaleString()}`,
      })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro na importação',
        text2:
          error instanceof Error
            ? error.message
            : 'Conteúdo inválido na área de transferência',
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Dump de Dados', headerShown: true }} />
      <ScrollView className="flex-1">
        <View className="gap-6 p-4">
          <Text variant="h3">Exportar/Importar via Dump JSON</Text>

          <Alert icon={FileSpreadsheet} variant="default">
            <AlertTitle>Sobre o formato</AlertTitle>
            <AlertDescription className="text-xs">
              O dump é um JSON contendo todas as tabelas: com seus registros
              completos. Você pode copiar o conteúdo e salvar em um arquivo
              `.json`, ou importar de um arquivo.
            </AlertDescription>
          </Alert>

          <View className="gap-3">
            <Text variant="h4">Exportar</Text>
            <Text className="text-muted-foreground">
              Gera o dump e copia para a área de transferência. Você pode colar
              em um arquivo e salvar.
            </Text>
            <Button
              onPress={handleExport}
              disabled={isExporting}
              className="flex-row gap-2"
            >
              {isExporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Icon
                  as={Download}
                  size={20}
                  className="text-primary-foreground"
                />
              )}
              <Text className="text-primary-foreground">
                {isExporting ? 'Gerando...' : 'Gerar Dump e Copiar'}
              </Text>
            </Button>
            {dumpPreview ? (
              <View className="p-3 bg-muted rounded-md">
                <Text className="font-medium text-sm mb-1">
                  Prévia (parcial):
                </Text>
                <Text
                  className="text-xs text-muted-foreground"
                  numberOfLines={6}
                >
                  {dumpPreview}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="gap-3">
            <Text variant="h4">Importar</Text>
            <Text className="text-muted-foreground">
              Importe de um arquivo `.json` ou da área de transferência.
            </Text>

            <Button
              onPress={handleImportFromFile}
              disabled={isImporting}
              variant="outline"
              className="flex-row gap-2"
            >
              {isImporting ? (
                <ActivityIndicator />
              ) : (
                <Icon as={Upload} size={20} className="text-foreground" />
              )}
              <Text>
                {isImporting ? 'Importando...' : 'Importar de Arquivo JSON'}
              </Text>
            </Button>

            <Button
              onPress={handleImportFromClipboard}
              disabled={isImporting}
              variant="outline"
              className="flex-row gap-2"
            >
              {isImporting ? (
                <ActivityIndicator />
              ) : (
                <Icon as={Clipboard} size={20} className="text-foreground" />
              )}
              <Text>
                {isImporting
                  ? 'Importando...'
                  : 'Importar da Área de Transferência'}
              </Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
