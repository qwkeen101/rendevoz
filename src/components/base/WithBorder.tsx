import { CSSProperties, DetailedHTMLProps, FC, forwardRef, HTMLAttributes, MouseEventHandler, PropsWithChildren } from 'react'

interface WithBorderProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>{
  boxShadowBorder?: boolean
  solidBorder?: boolean
  borderRadius?: number
  style?: CSSProperties
  className?: string
  onClick?: MouseEventHandler
  contentEditable?: boolean
}

const WithBorder: FC<PropsWithChildren<WithBorderProps>> = (
  { borderRadius = 5, boxShadowBorder = true, solidBorder = false, children, style, onClick, className, contentEditable, ...rest },
  ref
) => {
  const DefaultBorder: CSSProperties = {
    boxShadow: boxShadowBorder
      ? 'rgba(0, 0, 0, 0.24) 0px 3px 8px'
      : undefined,
    border: solidBorder ? '1px solid grey' : undefined,
    borderRadius: borderRadius,
    backgroundColor: 'white',
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
