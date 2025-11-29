import { Input } from '@/src/components/ui/input'
import { MaskInputProps, useMaskedInputProps } from '@/src/components/ui/masks'
import * as React from 'react'
import { TextInput } from 'react-native'

export default React.forwardRef(function (
  props: MaskInputProps,
  ref: React.Ref<TextInput>
) {
  const {
    mask,
    value,
    onChangeText,
    placeholderFillCharacter = '_',
    obfuscationCharacter,
    showObfuscatedValue,
    selection,
    maskAutoComplete,
    className,
    ...rest
  } = props

  const maskedInputProps = useMaskedInputProps({
    value,
    mask,
    maskAutoComplete,
    obfuscationCharacter,
    onChangeText,
    placeholderFillCharacter,
    showObfuscatedValue,
  })

  return (
    <Input
      placeholder={maskedInputProps.placeholder}
      {...(rest as any)}
      className={className}
      selection={maskedInputProps.selection || selection}
      value={maskedInputProps.value}
      onChangeText={maskedInputProps.onChangeText as any}
      ref={ref}
    />
  )
})
