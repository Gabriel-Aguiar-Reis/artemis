import { useActivateLicense } from '@/src/application/hooks/license.hooks'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog'
import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Input } from '@/src/components/ui/input'
import { Text } from '@/src/components/ui/text'
import { License } from '@/src/domain/entities/license/license.entity'
import { generateUserActivationCode } from '@/src/lib/license-crypto'
import * as Clipboard from 'expo-clipboard'
import { AlertCircle, Copy } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import Toast from 'react-native-toast-message'

type LicenseActivationDialogProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  license: License
}

export const LicenseActivationDialog = ({
  open,
  onOpenChange,
  license,
}: LicenseActivationDialogProps) => {
  const [inputCode, setInputCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const activateMutation = useActivateLicense()

  const userCode = generateUserActivationCode(license.uniqueCode)

  const handleCopy = async () => {
    await Clipboard.setStringAsync(userCode)
    Toast.show({
      type: 'success',
      text1: 'Código copiado!',
      text2: 'Cole e envie para o administrador',
    })
  }

  const handleActivate = async () => {
    if (!inputCode.trim()) {
      setError('Por favor, insira o código de ativação')
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
        text1: 'Licença ativada!',
        text2: 'Seu aplicativo foi liberado com sucesso',
      })
      onOpenChange?.(false)
    } catch (err) {
      setError('Código de licença inválido. Verifique e tente novamente.')
    }
  }

  const handleClear = () => {
    setInputCode('')
    setError(null)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            <View className="flex-row items-center gap-2">
              <Icon as={AlertCircle} size={24} className="text-destructive" />
              <Text>Aplicativo Bloqueado</Text>
            </View>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Seu aplicativo foi bloqueado e precisa ser ativado.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <View className="gap-4 py-4">
          <View className="gap-2">
            <Text className="font-semibold">Seu código de ativação:</Text>
            <Pressable
              onPress={handleCopy}
              className="flex-row items-center justify-between bg-muted p-3 rounded-lg border border-border active:bg-accent"
            >
              <Text className="font-mono text-lg font-bold">{userCode}</Text>
              <Icon as={Copy} size={20} className="text-muted-foreground" />
            </Pressable>
            <Text className="text-sm text-muted-foreground">
              Toque para copiar e envie para o administrador
            </Text>
          </View>

          <View className="gap-2">
            <Text className="font-semibold">
              Digite o código recebido do administrador:
            </Text>
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
            {error && <Text className="text-xs text-destructive">{error}</Text>}
          </View>
        </View>

        <AlertDialogFooter>
          {onOpenChange && (
            <Button variant="outline" onPress={() => onOpenChange(false)}>
              <Text>Cancelar</Text>
            </Button>
          )}
          <Button variant="outline" onPress={handleClear}>
            <Text>Limpar</Text>
          </Button>
          <AlertDialogAction
            onPress={handleActivate}
            disabled={activateMutation.isPending}
          >
            <Text>
              {activateMutation.isPending ? 'Validando...' : 'Ativar'}
            </Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
