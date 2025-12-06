import { NavigationButton } from '@/src/components/ui/navigation-button'
import { LinkProps } from 'expo-router'
import { BookOpenCheck } from 'lucide-react-native'

type ButtonFinishProps = {
  href: LinkProps['href']
}

export const ButtonFinish = ({ href }: ButtonFinishProps) => {
  return <NavigationButton href={href} icon={BookOpenCheck} />
}
