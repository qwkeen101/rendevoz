import Icon from '@/components/base/Icon'
import classNames from 'classnames'
import { cloneElement, createElement, CSSProperties, FC, forwardRef, MouseEventHandler, ReactElement, ReactNode } from 'react'
import Tooltip from '../Tooltip'
import styles from './index.module.less'
import ClassName from '@/styles/classNames'

interface ToolbarItemProps {
  onClick?: MouseEventHandler
  className?: string
  title?: string
  size?: number
  iconClassName?: string
  children?: ReactNode
  style?: CSSProperties
  iconName?: string
  space?: number
  strokeWidth?: number
  isActive?: boolean
  disabled?: boolean
  clickPreventDefault?: boolean
  tooltip?: string
  radius?: number
  popover?: ReactElement
}

const ToolbarItem: FC<ToolbarItemProps> = forwardRef(
  (
    {
      onClick,
      className,
      iconClassName,
      size = 18,
      children,
      style,
      title,
      iconName,
      clickPreventDefault = false,
      isActive = false,
      tooltip,
      disabled,
      strokeWidth = 4,
      radius
    },
    ref
  ) => {
    const renderItem = () => {
      if (iconName) {
        return (
          <Icon strokeWidth={strokeWidth} cursor={disabled ? 'inherit' : 'pointer'} className={iconClassName} size={size} name={iconName} />
        )
      }
      if (title) {
        return <div className={styles.title}>{title}</div>
      }
      return children
    }
    const handleClick = (e: MouseEvent) => {
      if (clickPreventDefault) {
        e.preventDefault()
      }
      onClick?.(e)
    }
    return (
      <Tooltip ref={ref} content={tooltip}>
        {cloneElement(
          createElement('div'),
          {
            key: iconName,
            'data-disabled': disabled,
            className: classNames(ClassName.circleButton(3, radius), className, isActive && 'active-button'),
            style: {
              ...style,
              display: 'flex',
              alignItems: 'center',
              cursor: disabled ? 'not-allowed' : style?.cursor
            },
            onPointerDown: clickPreventDefault ? e => e.preventDefault() : undefined,
            onPointerUp: clickPreventDefault ? e => e.preventDefault() : undefined,
            onClick: handleClick
          },
          renderItem()
        )}
      </Tooltip>
    )
  }
)
export default ToolbarItem
