import { NavigationButton } from '@/src/components/ui/navigation-button'
import { THEME } from '@/src/lib/theme'
import { LinkProps } from 'expo-router'
import { Search, SearchCheck } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'

type ButtonFilterProps = {
  href: LinkProps['href']
  isActive?: boolean
}

export const ButtonFilter = ({ href, isActive }: ButtonFilterProps) => {
  const { colorScheme } = useColorScheme()
  const palette = THEME[colorScheme === 'dark' ? 'dark' : 'light']
  return (
    <NavigationButton
      href={href}
      icon={isActive ? SearchCheck : Search}
      accessibilityLabel={
        isActive ? 'Filtros ativos, editar filtros' : 'Filtrar'
      }
      color={isActive ? palette.success : undefined}
    />
  )
}
