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
    display: 'none',
    opacity: 0
  },
  visible: {
    opacity: 1
  }
}
export const DockTabPaneContext = createContext<{
  context: DockContext
  currentTabId: string
} | null>(null)
export const DockTabPane: FC<DockTabPaneProps> = memo(({ cached, cacheId, parent, children, style, active }) => {
  const context = useContext(DockContextType)
  const ref = useRef<HTMLDivElement>(null)
  const cacheRef = useRef<TabPaneCache | null>(null)
  const symbol = useMemo(() => Symbol(), [])
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
      if (!ref.current.contains(cacheRef.current.div)) {
        ref.current.replaceChildren(cacheRef.current.div)
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
  // useUpdateIsomorphicLayoutEffect(() => {
  //   updateCache()
  // })
  useEffect(() => {
    console.log('update tabpane')
    return () => {
      if (cacheRef.current && cacheId) {
        context.removeTabCache(cacheId, symbol)
      }
    }
  }, [])
  const mergedStyle: React.CSSProperties = {
    ...style,
    position: 'relative',
    width: '100%',
    height: 'calc( 100% - 42px )'
  }
  return (
    <DockTabPaneContext.Provider value={{context, currentTabId: cacheId}}>
      <motion.div
        ref={ref}
        id={cacheId}
        onClick={handleClick}
        initial={{ opacity: 0 }}
        animate={active ? 'visible' : 'hidden'}
        variants={variants}
        transition={{ duration: 0.5, type: 'tween' }}
        role="tabpane"
        style={mergedStyle}
      >
        {children}
      </motion.div>
    </DockTabPaneContext.Provider>
  )
})
