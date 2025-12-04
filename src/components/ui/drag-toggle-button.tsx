import { Icon } from '@/src/components/ui/icon'
import { ArrowDownUp, Check } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable } from 'react-native'

type DragToggleButtonProps = {
  onPress?: () => void
}
export function DragToggleButton({ onPress }: DragToggleButtonProps) {
  const [isDragging, setIsDragging] = useState(false)
  return (
    <Pressable
      className="absolute bottom-16 left-4 z-50 bg-primary rounded-full p-2"
      onPress={() => {
        setIsDragging(!isDragging)
        onPress?.()
      }}
    >
      {isDragging ? (
        <Icon as={Check} size={24} className="text-secondary" />
      ) : (
        <Icon as={ArrowDownUp} size={24} className="text-secondary" />
      )}
    </Pressable>
  )
}
