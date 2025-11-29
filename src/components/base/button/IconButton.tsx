import { useMergedRef } from '@/hooks'
import classNames from 'classnames'
import React, { CSSProperties, forwardRef, MouseEventHandler, ReactElement, useLayoutEffect, useRef } from 'react'
import { Icon, Tooltip } from '..'
import Colors from '@/consts/colors'
import classnames from 'classnames'

const IconButton = forwardRef(
  (
    {
      icon,
      text,
      gap,
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
      iconClassName,
      onSuffixIconClick,
      iconColor,
      suffixIcon,
      textClassName,
      size = 16,
      suffixIconStyle,
      suffixIconClassName,
      image,
      suffixStrClassName = 'font-size-11',
      strokeWidth,
      smallText = true,
      ...rest
    }: {
      icon?: string | ReactElement
      onClick?: MouseEventHandler
      gap?: number
      text?: string
      image?: string
      strokeWidth?: number
      smallText?: boolean
      suffixIconStyle?: CSSProperties
      theme?: string
      suffixIconClassName?: string
      enabled?: boolean
      className?: string
      dangerous?: boolean
      reverse?: boolean
      iconClassName?: string
      spaceBetween?: boolean
      tabIndex?: number
      selected?: boolean
      style?: CSSProperties
      suffixIcon?: string
      onSuffixIconClick?: React.MouseEventHandler
      size?: number
      suffixStr?: string | number
      suffixStrClassName?: string
      textClassName?: string
      tooltip?: string | ReactElement
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
        <div
          onClick={onClick}
          tabIndex={tabIndex}
          onPointerEnter={onPointerEnter}
          {...rest}
          style={{
            gap,
            flexDirection: reverse && icon ? 'row-reverse' : undefined,
            justifyContent: spaceBetween ? 'space-between' : undefined,
            background: selected === true ? Colors.Background.ButtonHover : selected === false ? 'none' : undefined,
            ...style
          }}
          className={classNames(className, 'icon-button', dangerous && 'text-red-500')}
        >
          {image ? (
            <img src={image} className={'em:size-5 shrink-0 object-cover rounded'} />
          ) : icon ? (
            React.isValidElement(icon) ? (
              icon
            ) : typeof icon === 'string' ? (
              <Icon
                strokeWidth={strokeWidth}
                style={{
                  color: iconColor
                }}
                className={iconClassName}
                theme={theme}
                spin={spin}
                name={icon}
                size={size}
              />
            ) : null
          ) : null}
          {text && <div className={classnames('line-clamp-1 break-all', textClassName)}>{text}</div>}
          {(enabled || suffixIcon || suffixStr) && (
            <div className={'ml-auto gap-2 shrink-0 flex pl-5 suffix-font'}>
              {enabled && <Icon name="park-check" />}
              {suffixStr && <span className={suffixStrClassName}>{suffixStr}</span>}
              {suffixIcon && (
                <Icon
                  size={size}
                  className={suffixIconClassName}
                  onClick={onSuffixIconClick}
                  name={suffixIcon}
                  containerStyle={suffixIconStyle}
                />
              )}
            </div>
          )}
        </div>
      </Tooltip>
    )
  }
)

export default IconButton
