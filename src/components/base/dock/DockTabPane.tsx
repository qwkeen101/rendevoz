import React, { createContext, CSSProperties, FC, memo, ReactNode, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { DockContext, DockContextType, PanelData, TabPaneCache } from './DockData'
import { motion } from 'framer-motion'
import useUpdateIsomorphicLayoutEffect from '@/hooks/utils/useUpdateIsomorphicLayoutEffect'

interface DockTabPaneProps {
  cacheId?: string
  cached: boolean
  parent?: PanelData
  active?: boolean
  style?: CSSProperties
  className?: string
  children?: ReactNode
}
const variants = {
  hidden: {
    // visibility: 'hidden',
    // pointerEvents: 'none',
    // zIndex: -1,
    // position: 'absolute',
    opacity: 0,
    display: 'none'
  },
  visible: {
    opacity: 1
  }
}
export const DockTabPaneContext = createContext<{
  currentTabId: string
} | null>(null)
export const DockTabPane: FC<DockTabPaneProps> = memo(({ cached, cacheId, parent, children, style, active }) => {
  const context = useContext(DockContextType)
  const ref = useRef<HTMLDivElement>(null)
  const cacheRef = useRef<TabPaneCache | null>(null)
  const symbol = useMemo(() => Symbol(), [])
  const recursivelyScrollTop = (root: HTMLElement) => {
    const rootScrollTop = root.scrollTop
    if (rootScrollTop) {
      cacheRef.current?.scrollPreserver.set(root, rootScrollTop)
      return
    }
    root.childNodes.forEach(n => recursivelyScrollTop(n))
  }
  const updateCache = () => {
    const cache = cacheRef.current
    if (cache) {
      if (!cached || cacheId !== cache.id) {
        context.removeTabCache(cache.id, symbol)
        cacheRef.current = null
      }
    }
    if (cached && ref.current && cacheId) {
      cacheRef.current = context.getTabCache(cacheId, symbol)
      Array.from(cacheRef.current.scrollPreserver.entries()).forEach(([k, v]) => {
        k.scrollTop === 0 && (k.scrollTop = v)
      })

      recursivelyScrollTop(cacheRef.current.div)
      if (!ref.current.contains(cacheRef.current.div)) {
        ref.current.appendChild(cacheRef.current.div)
        Array.from(cacheRef.current.scrollPreserver.entries()).forEach(([k, v]) => {
          k.scrollTop === 0 && (k.scrollTop = v)
        })
      }
      context.updateTabCache(cacheId, children)
    }
  }

  const handleClick = () => {
    const layout = context.getLayout()
    context.setLayout({
      ...layout,
      global: {
        ...layout.global,
        currentFocusedPanelId: parent?.id
      }
    })
  }
  useLayoutEffect(() => {
    updateCache()
  })
  useLayoutEffect(() => {
    return () => {
      if (cacheRef.current) {
        recursivelyScrollTop(cacheRef.current.div)
        context.removeTabCache(cacheRef.current.id, symbol)
      }
    }
  }, [])

  let renderChildren: ReactNode = null
  if (cached) {
    renderChildren = null
  } else {
    renderChildren = children
  }
  const mergedStyle: React.CSSProperties = {
    ...style,
    position: 'relative',
    width: '100%',
    height: 'calc( 100% - 42px )'
  }
  return (
    <motion.div
      ref={ref}
      id={cacheId}
      onClick={handleClick}
      initial={{ opacity: 0 }}
      animate={active ? 'visible' : 'hidden'}
      variants={variants}
      transition={{ duration: 0.3, type: 'tween' }}
      role="tabpane"
      style={mergedStyle}
    >
      {renderChildren}
    </motion.div>
  )
})
