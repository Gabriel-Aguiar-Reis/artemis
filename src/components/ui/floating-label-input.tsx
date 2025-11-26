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
import {
  Animated,
  BlurEvent,
  Easing,
  ScrollView,
  TextInputProps,
  View,
} from 'react-native'

import { Button } from '@/src/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/src/components/ui/hover-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/src/components/ui/select'
import WheelPicker from '@quidone/react-native-wheel-picker'

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
  gap?: number
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

type FloatingLabelInputProps = BaseProps &
  (WithAlternate | WithoutAlternate) & {
    isDialog?: boolean
    period?: string
    number?: number
    PERIODS?: { nome: string; range: number[] }[]
    onWheelChange?: (value: string) => void
    isSelect?: boolean
    selectOptions?: { id: string; nome: string }[]
    onSelectChange?: (id: string) => void
    isSearch?: boolean
    onSearchPress?: () => void
    isSearchLoading?: boolean
  }

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
    isDialog,
    isSelect,
    selectOptions,
    onSelectChange,
    period,
    number,
    PERIODS,
    onWheelChange,
    isSearch,
    onSearchPress,
    isSearchLoading,
    gap = 0,
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
  // Quando for select, localizar opção selecionada para exibir o nome
  const selectedOption = isSelect
    ? (selectOptions || []).find((s) => s.id === value)
    : undefined
  const displayValue = isSelect
    ? (selectedOption?.nome ?? '')
    : ((value as any) ?? '')

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

      <View className={`flex-row w-full gap-${gap}`}>
        <Input
          value={displayValue}
          placeholder={placeholder}
          cursorColor={
            error ? '#ef4444' : colorScheme === 'dark' ? '#d4d4d4' : '#27272a'
          }
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          secureTextEntry={secure}
          editable={!disabled && !isDialog && !isSelect && !isSearchLoading}
          className={cn(
            'flex-1 border-border text-sm',
            activeIcon ? 'rounded-l-md rounded-r-none' : 'rounded-md',
            (isDialog || isSelect) && 'w-1/2 text-primary bg-secondary',
            error && 'border-red-500'
          )}
          {...rest}
        />
        {isDialog && !isSelect && (
          <Dialog>
            <DialogTrigger asChild className="w-40" disabled={disabled}>
              <Button className="rounded-none border-border" variant="outline">
                <Text className="text-sm font-semibold">Selecionar</Text>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-80 m-4">
              <DialogHeader>
                <DialogTitle>{label}</DialogTitle>
              </DialogHeader>
              <View className="gap-2">
                <View className="flex-row gap-4 justify-around">
                  <WheelPicker
                    data={(
                      PERIODS?.find((p) => p.nome === period)?.range || [1]
                    ).map((n) => ({
                      value: n.toString(),
                      label: n.toString(),
                    }))}
                    value={number?.toString() ?? '1'}
                    onValueChanged={(event) => {
                      const val = event?.item?.value
                      const newValue = `${val} ${period}`
                      onWheelChange?.(newValue)
                    }}
                    style={{ flex: 1 }}
                    itemTextStyle={{
                      color: colorScheme === 'dark' ? '#fafafa' : '#18181b',
                    }}
                    overlayItemStyle={{
                      backgroundColor:
                        colorScheme === 'dark' ? '#fafafa' : '#18181b',
                    }}
                    enableScrollByTapOnItem
                  />
                  <WheelPicker
                    data={
                      PERIODS?.map((p) => ({ value: p.nome, label: p.nome })) ??
                      []
                    }
                    value={period ?? 'dias'}
                    onValueChanged={(event) => {
                      const nome = event?.item?.value
                      const newRange =
                        PERIODS?.find((p) => p.nome === nome)?.range[0] ?? 1
                      const newValue = `${newRange} ${nome}`
                      onWheelChange?.(newValue)
                    }}
                    style={{ flex: 1 }}
                    itemTextStyle={{
                      color: colorScheme === 'dark' ? '#fafafa' : '#18181b',
                    }}
                    overlayItemStyle={{
                      backgroundColor:
                        colorScheme === 'dark' ? '#fafafa' : '#18181b',
                    }}
                    enableScrollByTapOnItem
                  />
                </View>
              </View>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>
                    <Text>Confirmar</Text>
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {isSelect && (
          <Select
            value={
              selectedOption
                ? { value: selectedOption.id, label: selectedOption.nome }
                : undefined
            }
            onValueChange={(opt) => {
              if (opt && typeof opt.value === 'string')
                onSelectChange?.(opt.value)
            }}
          >
            <SelectTrigger
              className="w-40 rounded-none border-border"
              disabled={disabled}
            >
              <Text className="text-sm font-semibold">Selecionar</Text>
            </SelectTrigger>
            <SelectContent>
              <ScrollView nestedScrollEnabled>
                {(selectOptions || []).map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} label={opt.nome}>
                    <Text>{opt.nome}</Text>
                  </SelectItem>
                ))}
              </ScrollView>
            </SelectContent>
          </Select>
        )}

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
          ) : alternateRightIcon ? (
            <Toggle
              pressed
              onPress={handleIconPress}
              onPressedChange={() => {}}
              variant="outline"
              className="justify-center items-center h-full rounded-l-none rounded-r-md"
              style={{ height: 40 }}
            >
              <Icon
                as={activeIcon}
                height={20}
                width={20}
                color={colorScheme === 'dark' ? '#737373' : '#a1a1a1'}
              />
            </Toggle>
          ) : (
            <Toggle
              pressed
              onPress={onSearchPress}
              onPressedChange={() => {}}
              variant="outline"
              className="justify-center items-center h-full rounded-l-none rounded-r-md"
              style={{ height: 40 }}
              disabled={!!isSearchLoading}
            >
              {isSearchLoading ? (
                <View className="w-5 h-5 border-2 border-t-transparent border-ring rounded-full animate-spin" />
              ) : (
                <Icon
                  as={activeIcon}
                  height={20}
                  width={20}
                  color={colorScheme === 'dark' ? '#737373' : '#a1a1a1'}
                />
              )}
            </Toggle>
          ))}
      </View>

      <View className="min-h-4 justify-center">
        {error && <Text className="ml-2 text-xs text-red-500">{error}</Text>}
      </View>
    </View>
  )
}
