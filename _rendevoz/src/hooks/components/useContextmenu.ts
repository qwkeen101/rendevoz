import { useEffect, useState } from 'react'
import { useMemoizedFn } from '../utils'

const useContextmenu = (ele?: HTMLElement | null, options?: {}) => {
  const [contextMenuState, setContextmenuState] = useState<{
    visible: boolean
    pageX?: number
    pageY?: number
    eleX?: number
    eleY?: number
  }>({
    visible: false
  })
  const contextmenuHandler = useMemoizedFn((e: MouseEvent) => {
    const containerBounding = ele?.getBoundingClientRect()
    const eleRelative = containerBounding
      ? {
          eleX: e.clientX - containerBounding.left,
          eleY: e.clientY - containerBounding.top
        }
      : undefined
    setContextmenuState(s => ({
      visible: true,
      pageX: e.clientX,
      pageY: e.clientY,
      ...eleRelative
    }))
  })
  const wheelHandler = () => {
    if (contextMenuState.visible) {
      setContextmenuState(s => ({ ...s, visible: false }))
    }
  }
  useEffect(() => {
    if (ele) {
      document.addEventListener('wheel', wheelHandler)
      document.addEventListener('scroll', wheelHandler)
      ele.addEventListener('contextmenu', contextmenuHandler)
      return () => {
        document.addEventListener('scroll', wheelHandler)
        document.removeEventListener('wheel', wheelHandler)
        ele.removeEventListener('contextmenu', contextmenuHandler)
      }
    }
  })
  const closeContextmenu = () => {
    setContextmenuState(s => ({ ...s, visible: false }))
  }
  return {
    closeContextmenu,
    contextMenuState
  }
}

export default useContextmenu
