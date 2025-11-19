import { Text } from '@/src/components/ui/text'
import { Toast } from '@/src/components/ui/toasts'
import { View } from 'react-native'

export const success: Toast = ({ text1 }) => (
  <View className="bg-green-600 px-4 py-3 rounded-md shadow-md">
    <Text className="text-white font-bold">{text1}</Text>
  </View>
)
