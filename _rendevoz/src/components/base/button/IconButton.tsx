import { useMergedRef } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import classNames from 'classnames'
import React, { CSSProperties, forwardRef, MouseEventHandler, useLayoutEffect, useRef } from 'react'
import { Icon, Tooltip, Content } from '..'
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
            ClassName.flatButton(undefined, '2px 8px', dangerous ? 'rgb(253, 138, 138, 0.2)' : undefined),
            dangerous && DangerousButtonClassName
          )}
        >
          {icon && <Icon theme={theme} spin={spin} name={icon} size={size} />}
          {text && <div className={ClassName.ellipsisFont(1)}>{text}</div>}
          {enabled && <Icon name="park-check-small" containerStyle={{ marginLeft: 'auto' }} />}
          {suffixIcon && (
            <Icon onClick={onSuffixIconClick} name={suffixIcon} containerStyle={{ marginLeft: 'auto', color: Colors.Font.Transparent }} />
          )}
          {suffixStr && (
            <span className={ClassName.description()} style={{ fontSize: 'inherit' }}>
              {suffixStr}
            </span>
          )}
        </Content>
      </Tooltip>
    )
  }
)

export default IconButton
