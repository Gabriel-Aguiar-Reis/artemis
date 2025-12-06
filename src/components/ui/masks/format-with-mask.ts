import {
  FormatWithMaskProps,
  FormatWithMaskResult,
} from '@/src/components/ui/masks'

export default function formatWithMask(
  props: FormatWithMaskProps
): FormatWithMaskResult {
  const {
    text,
    mask,
    obfuscationCharacter = '*',
    maskAutoComplete = false,
  } = props

  if (!text) return { masked: '', unmasked: '', obfuscated: '' }
  if (!mask)
    return { masked: text || '', unmasked: text || '', obfuscated: text || '' }

  let maskArray = typeof mask === 'function' ? mask(text) : mask

  let masked = ''
  let obfuscated = ''
  let unmasked = ''

  let maskCharIndex = 0
  let valueCharIndex = 0

  while (true) {
    if (maskCharIndex === maskArray.length) break

    let maskChar = maskArray[maskCharIndex]
    let valueChar = text[valueCharIndex]

    if (valueCharIndex === text.length) {
      if (typeof maskChar === 'string' && maskAutoComplete) {
        masked += maskChar
        obfuscated += maskChar
        maskCharIndex += 1
        continue
      }
      break
    }

    if (maskChar === valueChar) {
      masked += maskChar
      obfuscated += maskChar
      valueCharIndex += 1
      maskCharIndex += 1
      continue
    }

    let unmaskedValueChar = text[valueCharIndex]

    if (typeof maskChar === 'object') {
      valueCharIndex += 1

      const shouldObsfucateChar = Array.isArray(maskChar)
      const maskCharRegex = Array.isArray(maskChar) ? maskChar[0] : maskChar

      const matchRegex = RegExp(maskCharRegex).test(valueChar)

      if (matchRegex) {
        masked += valueChar
        obfuscated += shouldObsfucateChar ? obfuscationCharacter : valueChar
        unmasked += unmaskedValueChar
        maskCharIndex += 1
      }

      continue
    } else {
      masked += maskChar
      obfuscated += maskChar
      maskCharIndex += 1
      continue
    }
  }

  return { masked, unmasked, obfuscated }
}
