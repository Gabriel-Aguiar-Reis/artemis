import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Toast } from '@/src/components/ui/toasts'
import { AlertCircle } from 'lucide-react-native'
import { View } from 'react-native'

export const error: Toast = ({ text1, text2, props }) => (
  <View className="w-4/5 bg-destructive-subtle rounded-md overflow-hidden">
    <Alert
      icon={props.icon ?? AlertCircle}
      iconClassName="text-destructive"
      className="border-destructive bg-transparent"
    >
      <AlertTitle className="text-destructive">{text1}</AlertTitle>
      {text2 && (
        <AlertDescription className="text-destructive text-xs">
          {text2}
        </AlertDescription>
      )}
    </Alert>
  </View>
)
