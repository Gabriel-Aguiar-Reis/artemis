import { NavigationButton } from '@/src/components/ui/navigation-button'
import { LinkProps } from 'expo-router'
import { History } from 'lucide-react-native'

type ButtonHistoryProps = {
  href: LinkProps['href']
}

export const ButtonHistory = ({ href }: ButtonHistoryProps) => {
  return <NavigationButton href={href} icon={History} />
}
