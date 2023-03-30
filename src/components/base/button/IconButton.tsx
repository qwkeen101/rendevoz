import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import classNames from 'classnames'
import { MouseEventHandler } from 'react'
import { Icon } from '..'
import Content from '../Content'

const DangerousButtonClassName = css({
  color: '#FD8A8A'
})
const IconButton = ({
  icon,
  text,
  gap = 10,
  onClick,
  dangerous,
  className
}: {
  icon?: string
  onClick?: MouseEventHandler
  gap?: number
  text?: string
  className?: string
  dangerous?: boolean
}) => {
  return (
    <Content
      onClick={onClick}
      gap={gap}
      flex
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

export default IconButton
