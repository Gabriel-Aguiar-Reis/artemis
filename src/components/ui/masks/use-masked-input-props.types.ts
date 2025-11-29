import { Mask } from '@/src/components/ui/masks'

export type UseMaskedInputProps = {
  value?: string
  mask?: Mask
  onChangeText?(masked: string, unmasked: string, obfuscated: string): void
  showObfuscatedValue?: boolean
  placeholderFillCharacter?: string
  obfuscationCharacter?: string
  maskAutoComplete?: boolean
}
