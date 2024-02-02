import React, { cloneElement, CSSProperties, DetailedHTMLProps, forwardRef, HTMLAttributes } from 'react'
import { Property } from 'csstype'
import { default as IconPark, IconRender } from '@icon-park/react/es/all'
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
  iconStyle?: CSSProperties
  draggable?: boolean
}
const disableSvg = css({
  svg: {
    pointerEvents: 'none'
  },
  span: {
    pointerEvents: 'none'
  }
})
const Icon = forwardRef<HTMLDivElement, IconProps>(
  ({ name, size, strokeWidth, fill, spin, theme, className, iconStyle, cursor, color, onClick, containerStyle, style, ...rest }, ref) => {
    const s: React.CSSProperties = {
      cursor: cursor,
      userSelect: 'none',
      ...style
    }
    const renderIcon = (name: string) => {
      if (name.startsWith('park')) {
        return (
          <IconPark
            color={color}
            fill={fill}
            {...rest}
            style={iconStyle}
            strokeWidth={strokeWidth}
            type={name.slice(5)}
            theme={theme}
            spin={spin}
            size={size}
          />
        )
      }
      if (name.startsWith('custom')) {
        return <CustomIcon {...rest} color={color} type={name.slice(7)} theme={theme} fill={fill} size={size} strokeWidth={strokeWidth} />
      }
    }
    const ele = renderIcon(name)
    if (!ele) return null

    return (
      <Content
        {...rest}
        style={{ ...containerStyle, ...s }}
        className={classNames(className, disableSvg)}
        onClick={onClick}
        flex
        centered
        ref={ref}
      >
        {ele}
      </Content>
    )
  }
)
export default Icon
