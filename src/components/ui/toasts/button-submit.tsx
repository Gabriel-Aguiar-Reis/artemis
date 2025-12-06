import { Button, ButtonProps } from '@/src/components/ui/button'
import { ReactNode } from 'react'
import { View } from 'react-native'

type ButtonSubmitProps = {
  onPress: () => void
  children: ReactNode
  loading?: boolean
} & ButtonProps
export const ButtonSubmit = ({
  onPress,
  children,
  loading,
}: ButtonSubmitProps) => {
  return loading ? (
    <Button disabled>
      <View className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
    </Button>
  ) : (
    <Button onPress={onPress}>{children}</Button>
  )
}
