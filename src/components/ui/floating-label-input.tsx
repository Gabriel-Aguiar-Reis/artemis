import { Icon } from '@/src/components/ui/icon'
import { Input } from '@/src/components/ui/input'
import { Text } from '@/src/components/ui/text'
import { Toggle } from '@/src/components/ui/toggle'
import { cn } from '@/src/lib/utils'
import { LucideIcon } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Animated, BlurEvent, Easing, TextInputProps, View } from 'react-native'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/src/components/ui/hover-card'

type BaseProps = {
  label: string
  error?: string
  className?: string
  rightIcon?: LucideIcon
  rightIconTooltip?: ReactNode
  onPressRightIcon?: () => void
  alignTooltip?: 'start' | 'center' | 'end'
  sideTooltip?: 'top' | 'bottom'
  sideOffsetTooltip?: number
} & TextInputProps

type WithAlternate =
  | {
      alternateRightIcon: LucideIcon
      startSecreted?: boolean
      startDisabled?: boolean
      alternateToSecret: true
      alternateToDisabled?: false
    }
  | {
      alternateRightIcon: LucideIcon
      startSecreted?: boolean
      startDisabled?: boolean
      alternateToSecret?: false
      alternateToDisabled: true
    }

type WithoutAlternate = {
  alternateRightIcon?: undefined
  alternateToSecret?: boolean
  alternateToDisabled?: boolean
}

type FloatingLabelInputProps = BaseProps & (WithAlternate | WithoutAlternate)

export function FloatingLabelInput(props: FloatingLabelInputProps) {
  const {
    label,
    error,
    className,
    rightIcon,
    rightIconTooltip,
    alternateRightIcon,
    onPressRightIcon,
    alternateToSecret,
    alternateToDisabled,
    value = '',
    placeholder = '',
    onBlur,
    onChangeText,
    alignTooltip,
    sideTooltip,
    sideOffsetTooltip,
    ...rest
  } = props

  const startSecreted = alternateRightIcon ? props.startSecreted : undefined
  const startDisabled = alternateRightIcon ? props.startDisabled : undefined
  const [isFocused, setIsFocused] = useState(false)
  const [secure, setSecure] = useState(!!startSecreted)
  const [disabled, setDisabled] = useState(!!startDisabled)

  const hasValue = (value?.length ?? 0) > 0
  const shouldFloat = hasValue || isFocused || !!placeholder

  const animated = useRef(new Animated.Value(shouldFloat ? 1 : 0)).current
  const { colorScheme } = useColorScheme()

  const activeIcon = useMemo(() => {
    if (!rightIcon) return null
    if (!alternateRightIcon) return rightIcon

    if (alternateToSecret) {
      return secure ? alternateRightIcon : rightIcon
    }
    if (alternateToDisabled) {
      return disabled ? alternateRightIcon : rightIcon
    }
    return rightIcon
  }, [
    rightIcon,
    alternateRightIcon,
    secure,
    disabled,
    alternateToSecret,
    alternateToDisabled,
  ])

  const handleIconPress = useCallback(() => {
    onPressRightIcon?.()

    if (alternateToDisabled) setDisabled((prev) => !prev)
    if (alternateToSecret) setSecure((prev) => !prev)
  }, [onPressRightIcon, alternateToDisabled, alternateToSecret])

  useEffect(() => {
    Animated.timing(animated, {
      toValue: shouldFloat ? 1 : 0,
      duration: 80,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start()
  }, [shouldFloat])

  const labelStyle = {
    position: 'absolute' as const,
    left: 8,
    paddingHorizontal: 2,
    zIndex: 10,
    top: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [26, 10],
    }),
    fontSize: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 12],
    }),
  }

  const handleBlur = (e: BlurEvent) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  return (
    <View className={cn('relative', className)} style={{ paddingTop: 18 }}>
      <Animated.Text
        style={labelStyle}
        numberOfLines={1}
        className={cn(
          'bg-background',
          error
            ? 'text-red-500'
            : disabled
              ? 'text-ring'
              : 'text-muted-foreground'
        )}
      >
        {label}
      </Animated.Text>

      <View className="flex-row w-full">
        <Input
          value={value}
          placeholder={placeholder}
          cursorColor={
            error ? '#ef4444' : colorScheme === 'dark' ? '#d4d4d4' : '#27272a'
          }
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          secureTextEntry={secure}
          editable={!disabled}
          className={cn(
            'flex-1 border-border text-sm',
            activeIcon
              ? 'rounded-l-md rounded-tr-none rounded-br-none'
              : 'rounded-md',
            error && 'border-red-500'
          )}
          {...rest}
        />

        {activeIcon &&
          (rightIconTooltip && !alternateRightIcon ? (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Toggle
                  pressed
                  onPress={handleIconPress}
                  onPressedChange={() => {}}
                  variant="outline"
                  className="justify-center items-center rounded-tl-none rounded-bl-none rounded-r-md"
                  style={{ height: 40 }}
                >
                  <Icon
                    as={activeIcon}
                    height={20}
                    width={20}
                    color={colorScheme === 'dark' ? '#737373' : '#a1a1a1'}
                  />
                </Toggle>
              </HoverCardTrigger>
              <HoverCardContent
                align={alignTooltip}
                side={sideTooltip}
                sideOffset={sideOffsetTooltip}
              >
                <Text className="text-xs">{rightIconTooltip}</Text>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <Toggle
              pressed
              onPress={handleIconPress}
              onPressedChange={() => {}}
              variant="outline"
              className="justify-center items-center h-full rounded-tl-none rounded-bl-none rounded-r-md"
              style={{ height: 40 }}
            >
              <Icon
                as={activeIcon}
                height={20}
                width={20}
                color={colorScheme === 'dark' ? '#737373' : '#a1a1a1'}
              />
            </Toggle>
          ))}
      </View>

      <View style={{ minHeight: 20, justifyContent: 'center' }}>
        {error && <Text className="ml-2 text-xs text-red-500">{error}</Text>}
      </View>
    </View>
  )
}
