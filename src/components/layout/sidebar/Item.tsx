import * as React from 'react'
import classnames from 'classnames'

export const MenuItem = React.forwardRef(
  (
    {
      children,
      onClick,
      style,
      className
    }: {
      className?: string
      children: React.ReactNode
      onClick?: React.MouseEventHandler
      style?: React.CSSProperties
    },
    ref: React.ForwardedRef<HTMLLIElement>
  ) => {
    return (
      <div
        style={style}
        ref={ref}
        onClick={onClick}
        className={classnames([className, 'square-button flex items-center justify-center shrink-0'])}
      >
        {children}
      </div>
    )
  }
)
