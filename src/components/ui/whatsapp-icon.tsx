import WhatsAppSVG from '@/src/assets/images/whatsapp-icon.svg'
import { LucideProps } from 'lucide-react-native'
import { createElement, forwardRef } from 'react'
import { SvgProps } from 'react-native-svg'

export const WhatsAppIcon = forwardRef<any, LucideProps>((props, ref) => {
  const { size, color, strokeWidth, ...rest } = props
  const svgProps: SvgProps = {
    width: size,
    height: size,
    stroke: color as any,
    // pass-through other props if any
    ...(rest as unknown as SvgProps),
  }
  // cast to any because the imported SVG component typings may not accept ref
  return createElement(WhatsAppSVG as any, { ...svgProps, ref })
}) as unknown as React.ForwardRefExoticComponent<
  React.PropsWithoutRef<LucideProps> & React.RefAttributes<any>
>
