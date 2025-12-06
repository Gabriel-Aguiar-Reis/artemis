import {
  useActivateLicense,
  useLicense,
} from '@/src/application/hooks/license.hooks'
import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Input } from '@/src/components/ui/input'
import { Text } from '@/src/components/ui/text'
import { generateUserActivationCode } from '@/src/lib/license-crypto'
import * as Clipboard from 'expo-clipboard'
import { Stack, useRouter } from 'expo-router'
import { CalendarClock, Copy, RefreshCw } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function RenewLicenseScreen() {
  const router = useRouter()
  const { data: license, isLoading } = useLicense()
  const [inputCode, setInputCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const activateMutation = useActivateLicense()

  const userCode = license ? generateUserActivationCode(license.uniqueCode) : ''

  const handleCopy = async () => {
    await Clipboard.setStringAsync(userCode)
    Toast.show({
      type: 'success',
      text1: 'Código copiado!',
      text2: 'Cole e envie para o administrador',
    })
  }

  const handleActivate = async () => {
    if (!license) return

    if (!inputCode.trim()) {
      setError('Por favor, insira o código de renovação')
      return
    }

    setError(null)

    try {
      await activateMutation.mutateAsync({
        inputCode: inputCode.trim(),
        license,
      })
      Toast.show({
        type: 'success',
        text1: 'Licença renovada!',
        text2: 'Sua licença foi renovada com sucesso',
      })
      router.back()
    } catch (err) {
      setError('Código de licença inválido. Verifique e tente novamente.')
    }
  }

  const handleClear = () => {
    setInputCode('')
    setError(null)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR')
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    )
  }

  if (!license) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-4">
        <Text>Licença não encontrada</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: 'Renovar Licença',
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
              <Icon as={RefreshCw} size={28} className="text-primary" />
              <Text className="font-bold text-2xl">Renovação Antecipada</Text>
            </View>
            <Text className="text-muted-foreground">
              Solicite a renovação da sua licença antes do vencimento
            </Text>
          </View>

          {/* Status atual */}
          <View className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-600 rounded-lg gap-3">
            <View className="flex-row items-center gap-2">
              <Icon as={CalendarClock} size={20} className="text-blue-600" />
              <Text className="font-semibold text-blue-800 dark:text-blue-200">
                Status Atual da Licença
              </Text>
            </View>
            <View className="gap-1">
              <Text className="text-blue-700 dark:text-blue-300">
                Expira em {license.getDaysRemaining()} dias
              </Text>
              <Text className="text-sm text-blue-600 dark:text-blue-400">
                Válida até {formatDate(license.expirationDate)}
              </Text>
            </View>
          </View>

          {/* Código de ativação */}
          <View className="gap-3">
            <View className="gap-2">
              <Text className="font-semibold text-lg">
                1. Seu código de renovação
              </Text>
              <Text className="text-sm text-muted-foreground">
                Copie e envie este código para o administrador:
              </Text>
            </View>

            <Pressable
              onPress={handleCopy}
              className="flex-row items-center justify-between bg-muted p-4 rounded-lg border border-border active:bg-accent"
            >
              <Text className="font-mono text-xl font-bold flex-1">
                {userCode}
              </Text>
              <Icon
                as={Copy}
                size={24}
                className="text-muted-foreground ml-3"
              />
            </Pressable>
            <Text className="text-xs text-muted-foreground">
              Toque no código acima para copiar
            </Text>
          </View>

          {/* Campo de entrada */}
          <View className="gap-3">
            <View className="gap-2">
              <Text className="font-semibold text-lg">
                2. Código recebido do administrador
              </Text>
              <Text className="text-sm text-muted-foreground">
                Cole aqui o código que o administrador enviou:
              </Text>
            </View>

            <Input
              value={inputCode}
              onChangeText={(text) => {
                setInputCode(text)
                setError(null)
              }}
              placeholder="Cole o código aqui"
              autoCapitalize="characters"
              className={error ? 'border-destructive' : ''}
            />
            {error && <Text className="text-sm text-destructive">{error}</Text>}
          </View>

          {/* Botões de ação */}
          <View className="gap-3">
            <Button
              onPress={handleActivate}
              disabled={activateMutation.isPending || !inputCode.trim()}
              className="flex-row gap-2"
              size="lg"
            >
              <Icon
                as={RefreshCw}
                size={20}
                className="text-primary-foreground"
              />
              <Text className="text-lg">
                {activateMutation.isPending ? 'Renovando...' : 'Renovar Agora'}
              </Text>
            </Button>

            <View className="flex-row gap-2">
              <Button
                variant="outline"
                onPress={handleClear}
                className="flex-1"
              >
                <Text>Limpar</Text>
              </Button>
              <Button
                variant="outline"
                onPress={() => router.back()}
                className="flex-1"
              >
                <Text>Cancelar</Text>
              </Button>
            </View>
          </View>

          {/* Informações */}
          <View className="gap-3 p-4 bg-muted rounded-lg">
            <Text className="font-semibold">Como funciona:</Text>
            <View className="gap-2">
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground">1.</Text>
                <Text className="flex-1 text-muted-foreground">
                  Copie seu código de renovação e envie para o administrador
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground">2.</Text>
                <Text className="flex-1 text-muted-foreground">
                  O administrador gerará um código de ativação para você
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground">3.</Text>
                <Text className="flex-1 text-muted-foreground">
                  Cole o código recebido no campo acima
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground">4.</Text>
                <Text className="flex-1 text-muted-foreground">
                  Sua licença será renovada por mais 90 dias
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
