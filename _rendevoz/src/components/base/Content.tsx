import { DetailedHTMLProps, forwardRef, HTMLAttributes, memo } from 'react'
import { Property } from 'csstype'
import { css } from '@emotion/css'
import classNames from 'classnames'

interface ContentProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  position?: 'absolute' | 'relative' | 'fixed'
  flex?: boolean
  column?: boolean
  alignItems?: Property.AlignItems
  justifyContent?: Property.JustifyContent
  gap?: number | string
  centered?: boolean
  children?: React.ReactNode
  className?: string
  fullWidth?: boolean
  fullHeight?: boolean
  auto?: boolean
}
const Content = forwardRef<HTMLDivElement, ContentProps>(
  (
    {
      style,
      position = 'relative',
      flex,
      auto,
      column,
      justifyContent,
      alignItems,
      gap,
      centered,
      className,
      fullWidth,
      fullHeight,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={classNames(
          css({
            position: position,
            display: flex ? 'flex' : 'block',
            flexDirection: flex && column ? 'column' : 'row',
            justifyContent: centered ? 'center' : justifyContent,
            alignItems: centered ? 'center' : alignItems,
            flex: auto ? 'auto' : undefined,
            width: fullWidth ? '100%' : undefined,
            height: fullHeight ? '100%' : undefined
          }),
          className
        )}
        style={{
          ...style,
          gap
        }}
        {...rest}
      >
        {children}
      </div>
    )
  }
)

export default memo(Content)
