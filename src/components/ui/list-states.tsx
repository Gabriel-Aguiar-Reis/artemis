import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { ActivityIndicator, View } from 'react-native'

export function LoadingState({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-4">
      <ActivityIndicator size="large" />
      {label ? (
        <Text className="text-muted-foreground text-center">{label}</Text>
      ) : null}
    </View>
  )
}

export function ErrorState({
  message = 'Não foi possível carregar os dados.',
  onRetry,
}: {
  message?: string
  onRetry: () => void
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-4">
      <Text className="text-center text-muted-foreground">{message}</Text>
      <Button onPress={onRetry} accessibilityLabel="Tentar novamente">
        <Text>Tentar novamente</Text>
      </Button>
    </View>
  )
}
