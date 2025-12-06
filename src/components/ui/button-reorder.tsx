import { NavigationButton } from '@/src/components/ui/navigation-button'
import { LinkProps } from 'expo-router'
import { ArrowDownUp } from 'lucide-react-native'

type ButtonReorderProps = {
  href: LinkProps['href']
}

export const ButtonReorder = ({ href }: ButtonReorderProps) => {
  return <NavigationButton href={href} icon={ArrowDownUp} />
}
