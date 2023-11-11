import React, { CSSProperties, DetailedHTMLProps, forwardRef, HTMLAttributes } from 'react'
import { Property } from 'csstype'
import { default as IconPark } from '@icon-park/react/es/all'
import { Content } from '.'
import CustomIcon from '../custom/icons/CustomIcon'
import classNames from 'classnames'
import { css } from '@emotion/css'

export interface IconProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
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
      pointerEvents: 'auto',
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
      if (name.startsWith('custom')) {
        return <CustomIcon {...rest} style={style} className={className} type={name.slice(7)} theme={theme} size={size} />
      }
    }
    return (
      <Content
        {...rest}
        style={containerStyle}
        className={classNames(
          containerClassName,
          css({
            svg: {
              pointerEvents: 'none'
            }
          })
        )}
        onClick={onClick}
        flex
        centered
        ref={ref}
      >
        {renderIcon(name)}
      </Content>
    )
  }
)
export default Icon
