import React, { Children, cloneElement, CSSProperties, FC, HTMLAttributes, ReactElement, ReactNode, Ref } from 'react'
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
  itemSpace?: number | string
  itemSize?: string
  itemRadius?: number | string
  itemStyle?: CSSProperties
  itemClickPreventDefault?: boolean
  style?: CSSProperties
  gap?: string | number
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
  itemRadius = 'rounded',
  gap,
  itemSpace = 6,
  itemSize = 'icon-16',
  itemClickPreventDefault = false,
  style,
  itemClassName,
  innerRef,
  itemStyle,
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
          clickPreventDefault: itemClickPreventDefault,
          className: itemClassName,
          radius: itemRadius,
          iconSize: itemSize,
          ...element.props,
          style: {
            ...itemStyle,
            ...element.props.style
          }
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
      gap={style?.gap ?? gap ?? 5}
      flex
      centered
      className={className}
      column={direction === 'vertical'}
    >
      {tools}
    </Content>
  )
}
Toolbar.Item = ToolbarItem
Toolbar.Separator = ToolbarSeparator

export default Toolbar
