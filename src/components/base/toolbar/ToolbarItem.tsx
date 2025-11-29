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
  iconSize?: string
  iconClassName?: string
  children?: ReactNode
  style?: CSSProperties
  iconName?: string
  space?: number
  strokeWidth?: number
  isActive?: boolean
  disabled?: boolean
  clickPreventDefault?: boolean
  tooltip?: string | ReactElement
  radius?: number
  popover?: ReactElement
}

const ToolbarItem: FC<ToolbarItemProps> = forwardRef(
  (
    {
      onClick,
      className,
      iconClassName,
      iconSize,
      children,
      style,
      radius,
      title,
      iconName,
      clickPreventDefault = false,
      isActive = false,
      tooltip,
      disabled,
      strokeWidth
    },
    ref
  ) => {
    const renderItem = () => {
      if (iconName) {
        return (
          <Icon
            strokeWidth={strokeWidth}
            cursor={disabled ? 'inherit' : 'pointer'}
            className={classNames(iconClassName, iconSize)}
            name={iconName}
          />
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
            className: classNames('square-button flex items-center', className, isActive && 'active-button'),
            style: {
              ...style,
              borderRadius: style?.borderRadius ?? radius,
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
