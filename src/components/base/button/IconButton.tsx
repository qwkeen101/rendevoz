import { useMergedRef } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import classNames from 'classnames'
import React, { CSSProperties, forwardRef, MouseEventHandler, useLayoutEffect, useRef } from 'react'
import { Icon, Tooltip } from '..'
import Content from '../Content'
import Colors from '@/consts/colors'

const DangerousButtonClassName = css({
  color: Colors.Common.Red
})

const NoShrinkClassName = css({
  flexShrink: 0
})
const IconButton = forwardRef(
  (
    {
      icon,
      text,
      gap = 6,
      onClick,
      dangerous,
      className,
      reverse,
      spaceBetween,
      tabIndex,
      selected,
      onPointerEnter,
      style,
      tooltip,
      spin,
      suffixStr,
      enabled,
      theme,
      onSuffixIconClick,
      iconColor,
      suffixIcon,
      size,
      suffixIconStyle,
      suffixIconClassName,
      ...rest
    }: {
      icon?: string
      onClick?: MouseEventHandler
      gap?: number
      text?: string
      suffixIconStyle?: CSSProperties
      theme?: string
      suffixIconClassName?: string
      enabled?: boolean
      className?: string
      dangerous?: boolean
      reverse?: boolean
      spaceBetween?: boolean
      tabIndex?: number
      selected?: boolean
      style?: CSSProperties
      suffixIcon?: string
      onSuffixIconClick?: React.MouseEventHandler
      size?: number
      suffixStr?: string | number
      tooltip?: string
      spin?: boolean
      onPointerEnter?: React.PointerEventHandler
      iconColor?: string
    } & React.HTMLProps<HTMLDivElement>,
    ref
  ) => {
    const innerRef = useRef<HTMLDivElement>(null)
    const mergedRef = useMergedRef(innerRef, ref)

    return (
      <Tooltip content={tooltip} ref={mergedRef}>
        <Content
          role="button"
          onClick={onClick}
          gap={gap}
          flex
          tabIndex={tabIndex}
          alignItems={'center'}
          onPointerEnter={onPointerEnter}
          {...rest}
          style={{
            flexDirection: reverse && icon ? 'row-reverse' : 'row',
            justifyContent: spaceBetween ? 'space-between' : undefined,
            background:
              selected === true
                ? dangerous
                  ? 'rgb(253, 138, 138, 0.4)'
                  : Colors.Background.ButtonHover
                : selected === false
                ? 'none'
                : undefined,
            ...style
          }}
          className={classNames(
            className,
            NoShrinkClassName,
            ClassName.flatButton(undefined, '3px 8px', dangerous ? 'rgb(253, 138, 138, 0.2)' : undefined),
            dangerous && DangerousButtonClassName
          )}
        >
          {icon && (
            <Icon
              style={{
                color: iconColor,
                fontSize: '1.1em',
                marginRight: text ? 4 : 0
              }}
              theme={theme}
              spin={spin}
              name={icon}
              size={size}
            />
          )}
          {text && <div className={ClassName.ellipsisFont(1)}>{text}</div>}
          {(enabled || suffixIcon || suffixStr) && (
            <Content flex gap={4} style={{ marginLeft: 'auto', paddingLeft: 18 }}>
              {enabled && <Icon name="park-check-small" />}
              {suffixStr && <span style={{ fontSize: '12px', color: Colors.Font.Transparent }}>{suffixStr}</span>}
              {suffixIcon && (
                <Icon
                  className={suffixIconClassName}
                  onClick={onSuffixIconClick}
                  name={suffixIcon}
                  containerStyle={{ color: Colors.Font.Transparent, ...suffixIconStyle }}
                />
              )}
            </Content>
          )}
        </Content>
      </Tooltip>
    )
  }
)

export default IconButton
