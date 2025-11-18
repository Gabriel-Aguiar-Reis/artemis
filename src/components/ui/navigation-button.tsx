import { Button } from '@/src/components/ui/button'
import { Link, LinkProps } from 'expo-router'
import { useColorScheme } from 'nativewind'

type NavigationButtonProps = {
  href: LinkProps['href']
  icon: React.ComponentType<{ size: number; color?: string }>
  color?: string
}
export const NavigationButton = ({
  href,
  icon: Icon,
  color,
}: NavigationButtonProps) => {
  const { colorScheme } = useColorScheme()
  return (
    <Link href={href} asChild>
      <Button size="icon" variant="outline">
        <Icon
          size={24}
          color={color || (colorScheme === 'dark' ? 'white' : undefined)}
        />
      </Button>
    </Link>
  )
}
