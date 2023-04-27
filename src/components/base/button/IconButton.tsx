import { useMergedRef } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import classNames from 'classnames'
import { CSSProperties, forwardRef, MouseEventHandler, useLayoutEffect, useRef } from 'react'
import { Icon } from '..'
import Content from '../Content'
import Colors from '@/consts/colors'

const DangerousButtonClassName = css({
  color: '#FD8A8A'
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
      disableStyle
    }: {
      icon?: string
      onClick?: MouseEventHandler
      gap?: number
      text?: string
      className?: string
      dangerous?: boolean
      reverse?: boolean
      spaceBetween?: boolean
      tabIndex?: number
      selected?: boolean
      style?: CSSProperties
      disableStyle?: boolean
      onPointerEnter?: React.PointerEventHandler
    },
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
      <Content
        onClick={onClick}
        gap={gap}
        flex
        ref={mergedRef}
        tabIndex={tabIndex}
        onPointerEnter={onPointerEnter}
        style={{
          flexDirection: reverse && icon ? 'row-reverse' : 'row',
          justifyContent: spaceBetween ? 'space-between' : undefined,
          background:
            selected === true
              ? dangerous
                ? 'rgb(253, 138, 138, 0.2)'
                : Colors.Background.ButtonHover
              : selected === false
              ? 'none'
              : undefined,
          ...style
        }}
        className={classNames(
          className,
          ClassName.flatButton(undefined, undefined, dangerous ? 'rgb(253, 138, 138, 0.2)' : undefined),
          dangerous && DangerousButtonClassName
        )}
      >
        {icon && <Icon name={icon} />}
        <div>{text}</div>
      </Content>
    )
  }
)

export default IconButton
