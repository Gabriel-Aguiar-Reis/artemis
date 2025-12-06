import { NavigationButton } from '@/src/components/ui/navigation-button'
import { LinkProps } from 'expo-router'
import { Plus } from 'lucide-react-native'

type ButtonNewProps = {
  href: LinkProps['href']
}

export const ButtonNew = ({ href }: ButtonNewProps) => {
  return <NavigationButton href={href} icon={Plus} />
}
