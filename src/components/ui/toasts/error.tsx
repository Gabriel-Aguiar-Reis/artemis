import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Toast } from '@/src/components/ui/toasts'
import { AlertCircle } from 'lucide-react-native'
import { View } from 'react-native'

export const error: Toast = ({ text1, text2, props }) => (
  <View className="w-4/5 bg-red-50 dark:bg-red-900 rounded-md overflow-hidden">
    <Alert
      icon={props.icon ?? AlertCircle}
      iconClassName="text-red-500 dark:text-red-300"
      className="border-red-500 dark:border-red-300 bg-transparent"
    >
      <AlertTitle className="text-red-500 dark:text-red-300">
        {text1}
      </AlertTitle>
      {text2 && (
        <AlertDescription className="text-red-400 dark:text-red-200 text-xs">
          {text2}
        </AlertDescription>
      )}
    </Alert>
  </View>
)
