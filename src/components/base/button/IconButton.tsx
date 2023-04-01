import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import classNames from 'classnames'
import { forwardRef, MouseEventHandler } from 'react'
import { Icon } from '..'
import Content from '../Content'

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
      spaceBetween
    }: {
      icon?: string
      onClick?: MouseEventHandler
      gap?: number
      text?: string
      className?: string
      dangerous?: boolean
      reverse?: boolean
      spaceBetween?: boolean
    },
    ref
  ) => {
    return (
      <Content
        onClick={onClick}
        gap={gap}
        flex
        ref={ref}
        style={{
          flexDirection: reverse ? 'row-reverse' : 'row',
          justifyContent: spaceBetween ? 'space-between' : undefined
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
