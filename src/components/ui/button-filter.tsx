import { NavigationButton } from '@/src/components/ui/navigation-button'
import { LinkProps } from 'expo-router'
import { Search } from 'lucide-react-native'

export const ButtonFilter = ({ href }: { href: LinkProps['href'] }) => {
  return <NavigationButton href={href} icon={Search} />
}
