import { NavigationButton } from '@/src/components/ui/navigation-button'
import { LinkProps } from 'expo-router'
import { Plus } from 'lucide-react-native'

export const ButtonNew = ({ href }: { href: LinkProps['href'] }) => {
  return <NavigationButton href={href} icon={Plus} />
}
