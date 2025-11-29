import { CSSProperties, DetailedHTMLProps, FC, forwardRef, HTMLAttributes, MouseEventHandler, PropsWithChildren } from 'react'
import { Colors } from '@/consts'

interface WithBorderProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  boxShadowBorder?: boolean
  solidBorder?: boolean
  borderRadius?: number | string
  style?: CSSProperties
  className?: string
  onClick?: MouseEventHandler
  contentEditable?: boolean
  padding?: CSSProperties['padding']
  width?: number | string
  borderBoxShadow?: boolean
}

const WithBorder: FC<PropsWithChildren<WithBorderProps>> = (
  { borderRadius = '0.5rem', width, borderBoxShadow, children, style, onClick, className, contentEditable, padding, ...rest },
  ref
) => {
  const DefaultBorder: CSSProperties = {
    boxShadow: borderBoxShadow ? Colors.Background.BorderBoxShadow : Colors.Background.PopoverBoxShadow,
    borderRadius: borderRadius,
    border: Colors.Consts.Border,
    background: Colors.Background.Popover,
    padding,
    backdropFilter: 'blur(10px)',
    minWidth: width,
    ...style
  }
  const handleClick = e => {
    onClick?.(e)
  }
  return (
    <div ref={ref} {...rest} onClick={handleClick} contentEditable={contentEditable} className={className} style={DefaultBorder}>
      {children}
    </div>
  )
}

export default forwardRef(WithBorder)
