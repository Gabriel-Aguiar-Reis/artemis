import { Progress } from '@/src/components/ui/progress'
import { Text } from '@/src/components/ui/text'
import { View } from 'react-native'

type StepperProps = {
  currentStep: number
  totalSteps: number
}
export function Stepper({ currentStep, totalSteps }: StepperProps) {
  return (
    <View className="items-center w-2/3 self-center">
      <Progress value={(currentStep / totalSteps) * 100} />
      <View className="flex flex-row justify-between mt-2">
        <Text className="text-sm text-muted-foreground">
          Etapa {currentStep} de {totalSteps}
        </Text>
      </View>
    </View>
  )
}
