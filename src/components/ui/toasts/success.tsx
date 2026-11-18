import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Toast } from '@/src/components/ui/toasts'
import { CircleCheck } from 'lucide-react-native'
import { View } from 'react-native'

export const success: Toast = ({ text1, text2, props }) => (
  <View className="w-4/5 bg-success-subtle rounded-md overflow-hidden">
    <Alert
      icon={props.icon ?? CircleCheck}
      iconClassName="text-success"
      className="border-success bg-transparent"
    >
      <AlertTitle className="text-success">{text1}</AlertTitle>
      {text2 && (
        <AlertDescription className="text-success text-xs">
          {text2}
        </AlertDescription>
      )}
    </Alert>
  </View>
)
