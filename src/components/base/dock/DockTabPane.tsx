import React, { createContext, CSSProperties, FC, memo, ReactNode, useRef } from 'react'

interface DockTabPaneProps {
  cacheId?: string
  active?: boolean
  style?: CSSProperties
  children?: ReactNode
}

export const DockTabPaneContext = createContext<{
  currentTabId: string
} | null>(null)
export const DockTabPane: FC<DockTabPaneProps> = memo(({ cacheId, children, style, active }) => {
  const ref = useRef<HTMLDivElement>(null)
  const mergedStyle: React.CSSProperties = {
    ...style,
    position: active ? 'relative' : 'absolute',
    width: '100%',
    flex: 1,
    height: active ? undefined : '100%',
    overflow: 'hidden',
    opacity: active ? 1 : 0,
    visibility: active ? 'visible' : 'hidden',
    pointerEvents: active ? undefined : 'none',
    zIndex: active ? 1 : -10
  }
  return (
    <div ref={ref} id={cacheId} style={mergedStyle}>
      {children}
    </div>
  )
})
