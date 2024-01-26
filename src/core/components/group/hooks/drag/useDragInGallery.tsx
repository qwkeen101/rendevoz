import { RefObject, useEffect, useState } from 'react'
import { useGlobalIsDragging } from '@/core'
import checkDragInLinks from '@/core/components/group/hooks/drag/checkDragInLinks'
import { Colors } from '@/consts'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaGroupChild } from '~/typings'
import { AnimatePresence, motion } from 'framer-motion'
const useDragInGallery = (opts: {
  rowRef: RefObject<HTMLElement>
  value: MetaGroupChild
  canDragInside?: boolean
  dragIndicatorPosition: 'tb' | 'lr'
}) => {
  const { rowRef, canDragInside, dragIndicatorPosition } = opts
  const [draggingIndicator, setDraggingIndicator] = useState<{
    inLink?: 'in' | 'out'
    position?: 'inner' | 'top' | 'bottom'
  }>()
  const [globalDragging] = useGlobalIsDragging()
  const instance = useGroupInstance()
  useEffect(() => {
    if (globalDragging) {
      const body = rowRef.current
      if (body) {
        const pointermoveHandler = (e: PointerEvent) => {
          const bounding = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
          const { clientX, clientY } = e
          let position: 'top' | 'bottom' | 'inner' | undefined = undefined
          if (dragIndicatorPosition === 'lr') {
            const offsetX = clientX - bounding.left
            const widthBreakpoint = bounding.width / 3
            if (offsetX < widthBreakpoint) position = 'top'
            else if (offsetX > widthBreakpoint * 2) {
              position = 'bottom'
            } else {
              position = 'inner'
            }
            if (canDragInside === false && position === 'inner') {
              return
            }
            instance.dragOps?.setCurrentDragDetails?.({
              value: opts.value,
              towards: position
            })
            setDraggingIndicator({
              position
            })
          } else {
            const offsetY = clientY - bounding.top
            const heightBreakpoint = bounding.height / 3
            if (offsetY < heightBreakpoint) position = 'top'
            else if (offsetY > heightBreakpoint * 2) {
              position = 'bottom'
            } else {
              position = 'inner'
            }

            if (position === 'inner') {
              return
            }
            instance.dragOps?.setCurrentDragDetails?.({
              value: opts.value,
              towards: position
            })
            setDraggingIndicator({
              position
            })
          }
        }
        const pointerleaveHandler = () => {
          setDraggingIndicator(undefined)
          instance.dragOps?.setCurrentDragDetails?.(undefined)
        }
        body.addEventListener('pointermove', pointermoveHandler)
        body.addEventListener('pointerleave', pointerleaveHandler)
        return () => {
          setDraggingIndicator(undefined)
          body.removeEventListener('pointerleave', pointerleaveHandler)
          body.removeEventListener('pointermove', pointermoveHandler)
        }
      }
    }
  }, [globalDragging])

  const renderIndicator = () => {
    const pos = draggingIndicator?.position
    if (dragIndicatorPosition === 'lr') {
      return (
        <AnimatePresence>
          {pos && (
            <motion.div
              key={pos}
              style={{
                position: 'absolute',
                borderRadius: 8,
                background: Colors.Common.SelectColorTransparent,
                pointerEvents: 'none',
                top: 0,
                height: '100%',
                width: 4,
                left: pos === 'top' ? -12 : pos === 'bottom' ? 'calc(100% + 8px)' : 0
              }}
              initial={{ opacity: 0 }}
              transition={{ damping: 0, duration: 0.15 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            ></motion.div>
          )}
        </AnimatePresence>
      )
    } else {
      return (
        <AnimatePresence>
          {pos && (
            <motion.div
              key={pos}
              style={{
                position: 'absolute',
                background: Colors.Common.SelectColorTransparent,
                pointerEvents: 'none',
                left: 0,
                width: '100%',
                borderRadius: 4,
                height: pos === 'inner' ? '100%' : 4,
                top: pos === 'top' ? -6 : pos === 'bottom' ? 'calc(100% + 2px)' : 0
              }}
              initial={{ opacity: 0 }}
              transition={{ damping: 0, duration: 0.15 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            ></motion.div>
          )}
        </AnimatePresence>
      )
    }
  }

  return {
    renderIndicator
  }
}

export default useDragInGallery
