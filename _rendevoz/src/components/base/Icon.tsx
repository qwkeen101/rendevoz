import React, { CSSProperties, forwardRef } from 'react'
import { Property } from 'csstype'
import { default as IconPark } from '@icon-park/react/es/all'
import { Content } from '.'

export interface IconProps {
  name: string
  theme?: 'outline' | 'filled' | 'two-tone' | 'multi-color'
  strokeWidth?: number
  size?: number
  spin?: boolean
  cursor?: Property.Cursor
  className?: string
  containerStyle?: CSSProperties
  containerClassName?: string
  fill?: string | string[]
  color?: string
  style?: CSSProperties
  onClick?: React.MouseEventHandler
  onPointerDown?: React.PointerEventHandler
  onPointerMove?: React.PointerEventHandler
  onPointerUp?: React.PointerEventHandler
  draggable?: boolean
}
const Icon = forwardRef<HTMLDivElement, IconProps>(
  ({ name, size, strokeWidth, fill, spin, theme, className, cursor, color, onClick, containerClassName, containerStyle, ...rest }, ref) => {
    const style: React.CSSProperties = {
      cursor: cursor,
      userSelect: 'none',
      ...rest.style
    }
    const renderIcon = (name: string) => {
      if (name.startsWith('park')) {
        return (
          <IconPark
            color={color}
            fill={fill}
            {...rest}
            style={style}
            strokeWidth={strokeWidth}
            className={className}
            type={name.slice(5)}
            theme={theme}
            spin={spin}
            size={size}
          />
        )
      }
    }
    return (
      <Content style={containerStyle} className={containerClassName} onClick={onClick} flex centered ref={ref}>
        {renderIcon(name)}
      </Content>
    )
  }
)
export default Icon
