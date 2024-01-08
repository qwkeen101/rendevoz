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

const IconButton = forwardRef(
  (
    {
      icon,
      text,
      gap = 10,
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
      ...rest
    }: {
      icon?: string
      onClick?: MouseEventHandler
      gap?: number
      text?: string
      theme?: string
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
    useLayoutEffect(() => {
      if (selected !== undefined) {
        if (selected === false) {
          innerRef.current?.style.setProperty('background', 'none', 'important')
        }
      }
    }, [selected])
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
            ClassName.flatButton(undefined, '3px 8px', dangerous ? 'rgb(253, 138, 138, 0.2)' : undefined),
            dangerous && DangerousButtonClassName
          )}
        >
          {icon && (
            <Icon
              style={{
                color: iconColor,
                fontSize: '1.1em'
              }}
              theme={theme}
              spin={spin}
              name={icon}
              size={size}
            />
          )}
          {text && <div className={ClassName.ellipsisFont(1)}>{text}</div>}
          {enabled && <Icon name="park-check-small" containerStyle={{ marginLeft: 'auto' }} />}
          {suffixStr && <span style={{ fontSize: '12px', color: Colors.Font.SuperTransparent, marginLeft: 'auto' }}>{suffixStr}</span>}
          {suffixIcon && (
            <Icon onClick={onSuffixIconClick} name={suffixIcon} containerStyle={{ marginLeft: 'auto', color: Colors.Font.Transparent }} />
          )}
        </Content>
      </Tooltip>
    )
  }
)

export default IconButton
