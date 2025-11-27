import WhatsAppSVG from '@/src/assets/images/whatsapp-icon.svg'
import { cssInterop } from 'nativewind'
import { forwardRef } from 'react'
import { SvgProps } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
  className?: string
} & Omit<SvgProps, 'width' | 'height'>

const WhatsAppIconBase = forwardRef<SVGElement, Props>(
  ({ size = 16, color = 'currentColor', className, ...rest }, ref) => {
    return (
      <WhatsAppSVG
        width={size}
        height={size}
        fill={color}
        className={className}
        {...rest}
      />
    )
  }
)

// Permitir usar className e size do NativeWind igual aos Lucide Icons
cssInterop(WhatsAppIconBase, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      width: 'size',
      height: 'size',
    },
  },
})

export const WhatsAppIcon = WhatsAppIconBase
