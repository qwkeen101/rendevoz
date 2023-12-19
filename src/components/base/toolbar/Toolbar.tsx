import React, { Children, cloneElement, CSSProperties, FC, HTMLAttributes, ReactNode, Ref } from 'react'
import Content from '../Content'
import ToolbarItem from './ToolbarItem'
import ToolbarSeparator from './ToolbarSeparator'
import styles from './index.module.less'
import classNames from 'classnames'
import flattenChildren from '@/utils/array'

export interface ToolbarProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  direction?: 'vertical' | 'horizontal'
  children?: ReactNode
  className?: string
  itemClassName?: string
  itemSpace?: number
  itemSize?: number
  itemRadius?: number
  itemStyle?: CSSProperties
  itemClickPreventDefault?: boolean
  style?: CSSProperties
  innerRef?: Ref<HTMLDivElement>
  disableDefaultStyle?: boolean
}
interface IToolbar extends FC<ToolbarProps> {
  Item: typeof ToolbarItem
  Separator: typeof ToolbarSeparator
}
const Toolbar: IToolbar = ({
  className,
  children,
  direction = 'horizontal',
  itemRadius = 4,
  itemSpace = 6,
  itemSize,
  itemClickPreventDefault = false,
  style,
  itemClassName,
  innerRef,
  itemStyle,
  disableDefaultStyle,
  ...rest
}) => {
  let tools

  if (children) {
    tools = flattenChildren(children).map((element, index) => {
      if (!element) {
        return element
      }
      if (React.isValidElement(element)) {
        return cloneElement(element, {
          key: index,
          direction: direction,
          space: itemSpace,
          size: itemSize,
          clickPreventDefault: itemClickPreventDefault,
          className: itemClassName,
          radius: itemRadius,
          ...element.props,
          style: {
            ...itemStyle,
            ...element.props.style
          },
        })
      }
      return element
    })
  }

  return (
    <Content
      {...rest}
      ref={innerRef}
      style={style}
      gap={style?.gap ?? 5}
      flex
      centered
      className={classNames(!disableDefaultStyle && styles.toolbar, className)}
      column={direction === 'vertical'}
    >
      {tools}
    </Content>
  )
}
Toolbar.Item = ToolbarItem
Toolbar.Separator = ToolbarSeparator

export default Toolbar
