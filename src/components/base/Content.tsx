import React, { CSSProperties, forwardRef, PropsWithoutRef, RefAttributes } from 'react'

type ContentProps = React.JSX.IntrinsicElements['div'] & {
  position?: CSSProperties['position']
  flex?: boolean
  column?: boolean
  alignItems?: CSSProperties['alignItems']
  justifyContent?: CSSProperties['justifyContent']
  gap?: number | string
  centered?: boolean
  children?: React.ReactNode
  className?: string
  fullWidth?: boolean
  fullHeight?: boolean
  auto?: boolean
  style?: CSSProperties
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
    }: ContentProps,
    ref
  ) => {
    return (
      <div
        {...rest}
        ref={ref}
        className={className}
        style={{
          flex: style?.flex ?? (auto ? 'auto' : undefined),
          ...style,
          position: style?.position ?? position,
          display: style?.display ?? (flex ? 'flex' : undefined),
          flexDirection: style?.flexDirection ?? (column ? 'column' : undefined),
          justifyContent: style?.justifyContent ?? (centered ? 'center' : justifyContent),
          alignItems: style?.alignItems ?? (centered ? 'center' : alignItems),
          width: fullWidth ? '100%' : style?.width,
          height: fullHeight ? '100%' : style?.height,
          gap: style?.gap || gap
        }}
      >
        {children}
      </div>
    )
  }
)

export default Content
