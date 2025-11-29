import React, { CSSProperties, DetailedHTMLProps, forwardRef, HTMLAttributes, ReactElement } from 'react'
import { Property } from 'csstype'
import { default as IconPark } from '@icon-park/react/es/all'
import { Content, Tooltip } from '.'
import CustomIcon from '../custom/icons/CustomIcon'
import classnames from 'classnames'

export interface IconProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  name?: string
  theme?: 'outline' | 'filled' | 'two-tone' | 'multi-color'
  strokeWidth?: number
  size?: number | string
  spin?: boolean
  cursor?: Property.Cursor
  className?: string
  containerStyle?: CSSProperties
  fill?: string | string[]
  color?: string
  style?: CSSProperties
  onClick?: React.MouseEventHandler
  onPointerDown?: React.PointerEventHandler
  onPointerMove?: React.PointerEventHandler
  onPointerUp?: React.PointerEventHandler
  iconStyle?: CSSProperties
  draggable?: boolean
  tooltip?: string | ReactElement
}
const Icon = forwardRef<HTMLDivElement, IconProps>(
  (
    {
      name,
      tooltip,
      size,
      strokeWidth = 3,
      fill,
      spin,
      theme,
      className,
      iconStyle,
      cursor,
      color,
      onClick,
      containerStyle,
      style,
      ...rest
    },
    ref
  ) => {
    const s: React.CSSProperties = {
      cursor: cursor,
      userSelect: 'none',
      ...style
    }
    let sizeClass: string | undefined = undefined
    let sizeNum: number | undefined = undefined
    if (typeof size === 'string') {
      sizeClass = size
    }
    if (typeof size === 'number') {
      if (size >= 12 && size <= 24) {
        sizeClass = `icon-${size}`
      } else {
        sizeNum = size
      }
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
            className={classnames('pointer-events-none', sizeClass)}
            size={sizeNum}
            spin={spin}
          />
        )
      }
      if (name.startsWith('custom')) {
        return (
          <CustomIcon
            {...rest}
            size={sizeNum}
            className={classnames('pointer-events-none', sizeClass)}
            color={color}
            type={name.slice(7)}
            theme={theme}
            fill={fill}
            strokeWidth={strokeWidth}
          />
        )
      }
    }
    const ele = name && renderIcon(name)
    if (!ele) return null
    if (tooltip) {
      return (
        <Tooltip content={tooltip} ref={ref}>
          <div
            {...rest}
            style={{ ...containerStyle, ...s }}
            className={classnames('flex items-center justify-center', className)}
            onClick={onClick}
          >
            {ele}
          </div>
        </Tooltip>
      )
    }
    return (
      <div
        {...rest}
        style={{ ...containerStyle, ...s }}
        className={classnames('flex items-center justify-center', className)}
        onClick={onClick}
        ref={ref}
      >
        {ele}
      </div>
    )
  }
)
export default Icon
