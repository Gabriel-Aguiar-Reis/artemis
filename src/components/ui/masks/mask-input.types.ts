import { Mask } from '@/src/components/ui/masks'
import type { TextInputProps } from 'react-native'

export interface MaskInputProps extends Omit<TextInputProps, 'onChangeText'> {
  mask?: Mask
  onChangeText?(masked: string, unmasked: string, obfuscated: string): void
  showObfuscatedValue?: boolean
  placeholderFillCharacter?: string
  obfuscationCharacter?: string
  maskAutoComplete?: boolean
}
