import { Button } from '@/src/components/ui/button'
import { Link, LinkProps } from 'expo-router'
import { useColorScheme } from 'nativewind'

export const NavigationButton = ({
  href,
  icon: Icon,
}: {
  href: LinkProps['href']
  icon: React.ComponentType<{ size: number; color?: string }>
}) => {
  const { colorScheme } = useColorScheme()
  return (
    <Link href={href} asChild>
      <Button size="icon" variant="outline">
        <Icon size={24} color={colorScheme === 'dark' ? 'white' : undefined} />
      </Button>
    </Link>
  )
}
