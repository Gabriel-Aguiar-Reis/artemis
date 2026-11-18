import { Icon } from '@/src/components/ui/icon'
import { ArrowUp } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
} from 'react-native'

const DEFAULT_THRESHOLD = 400

/**
 * Controls the visibility of the "back to top" button for a list.
 * The state only changes when the boolean changes (not on every scroll frame).
 */
export function useBackToTop<T = any>(threshold = DEFAULT_THRESHOLD) {
  const listRef = useRef<T>(null)
  const visibleRef = useRef(false)
  const [isVisible, setIsVisible] = useState(false)

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = e.nativeEvent.contentOffset.y > threshold
      if (next !== visibleRef.current) {
        visibleRef.current = next
        setIsVisible(next)
      }
    },
    [threshold]
  )

  return { listRef, isVisible, onScroll }
}

type BackToTopButtonProps = {
  /** Ref of a FlashList/FlatList (scrollToOffset) or ScrollView (scrollTo) */
  scrollRef?: React.RefObject<any>
  onPress?: () => void
  isVisible: boolean
}

export function BackToTopButton({
  scrollRef,
  onPress,
  isVisible,
}: BackToTopButtonProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [isVisible, fadeAnim])

  const scrollToTop = () => {
    if (onPress) {
      onPress()
      return
    }
    const ref = scrollRef?.current
    if (!ref) return
    if (typeof ref.scrollToOffset === 'function') {
      ref.scrollToOffset({ offset: 0, animated: true })
    } else if (typeof ref.scrollTo === 'function') {
      ref.scrollTo({ y: 0, animated: true })
    }
  }

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      className="absolute bottom-16 right-4 z-50"
      style={{ opacity: fadeAnim }}
    >
      <Pressable
        onPress={scrollToTop}
        accessibilityRole="button"
        accessibilityLabel="Voltar ao topo"
        className="bg-primary rounded-full p-2"
        disabled={!isVisible}
      >
        <Icon as={ArrowUp} size={24} className="text-secondary" />
      </Pressable>
    </Animated.View>
  )
}
