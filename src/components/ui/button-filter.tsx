import { NavigationButton } from '@/src/components/ui/navigation-button'
import { LinkProps } from 'expo-router'
import { Search, SearchCheck } from 'lucide-react-native'

type ButtonFilterProps = {
  href: LinkProps['href']
  isActive?: boolean
}

export const ButtonFilter = ({ href, isActive }: ButtonFilterProps) => {
  return (
    <NavigationButton
      href={href}
      icon={isActive ? SearchCheck : Search}
      color={isActive ? '#16a34a' : undefined}
    />
  )
}
