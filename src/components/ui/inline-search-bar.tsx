import { Icon } from '@/src/components/ui/icon'
import { THEME } from '@/src/lib/theme'
import { Search, X } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useEffect, useRef, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'

type InlineSearchBarProps = {
  /** Current committed value (e.g. from route params) */
  value?: string
  /** Called with the trimmed term after the user stops typing */
  onSearch: (term: string) => void
  placeholder?: string
  debounceMs?: number
  autoFocus?: boolean
}

/**
 * Search field shown at the top of a list. Debounced, so the query only runs
 * once the user pauses typing.
 */
export function InlineSearchBar({
  value = '',
  onSearch,
  placeholder = 'Pesquisar...',
  debounceMs = 300,
  autoFocus,
}: InlineSearchBarProps) {
  const { colorScheme } = useColorScheme()
  const palette = THEME[colorScheme === 'dark' ? 'dark' : 'light']
  const [text, setText] = useState(value)
  const lastSent = useRef(value)

  // Keep in sync when the value changes from outside (e.g. "clear filters")
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value
      setText(value)
    }
  }, [value])

  useEffect(() => {
    const term = text.trim()
    if (term === lastSent.current) return
    const t = setTimeout(() => {
      lastSent.current = term
      onSearch(term)
    }, debounceMs)
    return () => clearTimeout(t)
  }, [text, debounceMs, onSearch])

  return (
    <View className="flex-row items-center h-11 rounded-lg border border-input bg-card px-3 gap-2">
      <Icon as={Search} size={18} className="text-muted-foreground" />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={palette.mutedForeground}
        className="flex-1 text-base text-foreground"
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {text.length > 0 && (
        <Pressable
          onPress={() => setText('')}
          hitSlop={8}
          accessibilityLabel="Limpar busca"
        >
          <Icon as={X} size={18} className="text-muted-foreground" />
        </Pressable>
      )}
    </View>
  )
}
