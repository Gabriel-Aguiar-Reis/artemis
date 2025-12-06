import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Link, LinkProps } from 'expo-router'
import { LucideIcon } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'

type NavigationButtonProps = {
  href: LinkProps['href']
  icon: LucideIcon
  color?: string
}
export const NavigationButton = ({
  href,
  icon,
  color,
}: NavigationButtonProps) => {
  const { colorScheme } = useColorScheme()
  return (
    <Link href={href} asChild>
      <Button size="icon" variant="outline">
        <Icon
          as={icon}
          size={24}
          color={color || (colorScheme === 'dark' ? 'white' : undefined)}
        />
      </Button>
    </Link>
  )
}
