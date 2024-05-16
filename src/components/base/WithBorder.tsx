import ClassName from '@/styles/classNames'
import classNames from 'classnames'
import { CSSProperties, DetailedHTMLProps, FC, forwardRef, HTMLAttributes, MouseEventHandler, PropsWithChildren } from 'react'
import { Colors } from '@/consts'

interface WithBorderProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  boxShadowBorder?: boolean
  solidBorder?: boolean
  borderRadius?: number
  style?: CSSProperties
  className?: string
  onClick?: MouseEventHandler
  contentEditable?: boolean
  padding?: CSSProperties['padding']
  width?: number
  borderBoxShadow?: boolean
}

const WithBorder: FC<PropsWithChildren<WithBorderProps>> = (
  { borderRadius = 8, width, borderBoxShadow, children, style, onClick, className, contentEditable, padding, ...rest },
  ref
) => {
  const DefaultBorder: CSSProperties = {
    boxShadow: borderBoxShadow ? Colors.Background.BorderBoxShadow : Colors.Background.PopoverBoxShadow,
    // border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: borderRadius,
    background: Colors.Background.Popover,
    padding,
    minWidth: width,
    fontSize: 14,
    ...style
  }
  const handleClick = e => {
    // e.stopPropagation()
    onClick?.(e)
  }
  return (
    <div ref={ref} {...rest} onClick={handleClick} contentEditable={contentEditable} className={className} style={DefaultBorder}>
      {children}
    </div>
  )
}

export default forwardRef(WithBorder)
