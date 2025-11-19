import { Alert, AlertTitle } from '@/src/components/ui/alert'
import { Toast } from '@/src/components/ui/toasts'
import { CircleCheck } from 'lucide-react-native'
import { View } from 'react-native'

export const success: Toast = ({ text1, props }) => (
  <View className="w-4/5 bg-green-50 dark:bg-green-900 rounded-md overflow-hidden">
    <Alert
      icon={props.icon ?? CircleCheck}
      iconClassName="text-green-500 dark:text-green-300"
      className="border-green-500 dark:border-green-300 bg-transparent"
    >
      <AlertTitle className="text-green-500 dark:text-green-300">
        {text1}
      </AlertTitle>
    </Alert>
  </View>
)
