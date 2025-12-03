import { Icon } from '@/src/components/ui/icon'
import { ArrowUp } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Animated, Pressable } from 'react-native'

type BackToTopButtonProps = {
  scrollRef: React.RefObject<any>
  isVisible: boolean
}

export function BackToTopButton({
  scrollRef,
  isVisible,
}: BackToTopButtonProps) {
  const fadeAnim = useState(new Animated.Value(0))[0]

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 1000,
      useNativeDriver: true,
    }).start()
  }, [isVisible])

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true })
    }
  }

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      className="absolute bottom-16 right-4 z-50"
      style={{ opacity: fadeAnim, display: 'flex' }}
    >
      <Pressable
        onPress={scrollToTop}
        accessibilityLabel="Voltar ao topo"
        className="bg-primary rounded-full p-2"
        style={{ opacity: isVisible ? 1 : 0 }}
        disabled={!isVisible}
      >
        <Icon as={ArrowUp} size={24} className="text-secondary" />
      </Pressable>
    </Animated.View>
  )
}
