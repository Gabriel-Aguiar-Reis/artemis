import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Input } from '@/src/components/ui/input'
import { Text } from '@/src/components/ui/text'
import { generateLicenseCodeForUser } from '@/src/lib/license-crypto'
import * as Clipboard from 'expo-clipboard'
import { Stack } from 'expo-router'
import { Copy, KeyRound } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function GenerateLicenseScreen() {
  const [userCode, setUserCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!userCode.trim()) {
      setError('Por favor, insira o código do usuário')
      return
    }

    // Validar formato do código (XXXXXX-DDMMYY)
    const codePattern = /^[A-Z0-9]{6}-\d{6}$/
    if (!codePattern.test(userCode.trim())) {
      setError('Formato inválido. Use: XXXXXX-DDMMYY')
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const [uniqueCode, dateStr] = userCode.trim().split('-')
      const licenseCode = await generateLicenseCodeForUser(uniqueCode, dateStr)
      setGeneratedCode(licenseCode)
    } catch (err) {
      setError('Erro ao gerar código. Verifique o formato.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (generatedCode) {
      await Clipboard.setStringAsync(generatedCode)
      Toast.show({
        type: 'success',
        text1: 'Código copiado!',
        text2: 'Envie para o usuário ativar a licença',
      })
    }
  }

  const handleClear = () => {
    setUserCode('')
    setGeneratedCode(null)
    setError(null)
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: 'Gerar Código de Licença',
          headerBackTitle: 'Voltar',
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Icon as={KeyRound} size={28} className="text-primary" />
              <Text className="font-bold text-2xl">Gerar Licença</Text>
            </View>
            <Text className="text-muted-foreground">
              Insira o código fornecido pelo usuário para gerar uma licença de
              90 dias
            </Text>
          </View>

          {/* Input Section */}
          <View className="gap-3">
            <View className="gap-2">
              <Text className="font-semibold">Código do usuário:</Text>
              <Input
                value={userCode}
                onChangeText={(text) => {
                  setUserCode(text.toUpperCase())
                  setError(null)
                  setGeneratedCode(null)
                }}
                placeholder="XXXXXX-DDMMYY"
                autoCapitalize="characters"
                className={error ? 'border-destructive' : ''}
              />
              <Text className="text-xs text-muted-foreground">
                Formato: código único (6 caracteres) - data (DDMMYY)
              </Text>
              {error && (
                <Text className="text-sm text-destructive">{error}</Text>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                onPress={handleClear}
                className="flex-1"
              >
                <Text>Limpar</Text>
              </Button>
              <Button
                onPress={handleGenerate}
                disabled={isGenerating || !userCode.trim()}
                className="flex-1"
              >
                <Text>{isGenerating ? 'Gerando...' : 'Gerar Código'}</Text>
              </Button>
            </View>
          </View>

          {/* Generated Code Section */}
          {generatedCode && (
            <View className="gap-3 p-4 bg-green-100 dark:bg-green-950 border border-green-600 rounded-lg">
              <View className="gap-2">
                <Text className="font-semibold text-green-800 dark:text-green-200">
                  ✓ Código gerado com sucesso!
                </Text>
                <Text className="text-sm text-green-700 dark:text-green-300">
                  Copie e envie este código para o usuário:
                </Text>
              </View>

              <Pressable
                onPress={handleCopy}
                className="flex-row items-center justify-between bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-600 active:bg-green-200 dark:active:bg-green-800"
              >
                <Text className="font-mono text-base font-bold flex-1 text-green-800 dark:text-green-200">
                  {generatedCode}
                </Text>
                <Icon as={Copy} size={20} className="text-green-600 ml-2" />
              </Pressable>

              <Text className="text-xs text-green-700 dark:text-green-400">
                Toque no código acima para copiar
              </Text>
            </View>
          )}

          {/* Instructions */}
          <View className="gap-3 p-4 bg-muted rounded-lg">
            <Text className="font-semibold">Instruções:</Text>
            <View className="gap-2">
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground">1.</Text>
                <Text className="flex-1 text-muted-foreground">
                  Solicite ao usuário o código de ativação (formato:
                  XXXXXX-DDMMYY)
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground">2.</Text>
                <Text className="flex-1 text-muted-foreground">
                  Insira o código no campo acima
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground">3.</Text>
                <Text className="flex-1 text-muted-foreground">
                  Gere e copie o código de licença
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground">4.</Text>
                <Text className="flex-1 text-muted-foreground">
                  Envie o código gerado para o usuário renovar a licença (90
                  dias)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
