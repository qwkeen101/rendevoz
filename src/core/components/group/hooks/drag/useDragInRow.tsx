import { RefObject, useEffect, useState } from 'react'
import { useGlobalIsDragging } from '@/core'
import checkDragInLinks from '@/core/components/group/hooks/drag/checkDragInLinks'
import { Colors } from '@/consts'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaGroupChild } from '~/typings'
import { AnimatePresence, motion } from 'framer-motion'
const useDragInRow = (opts: {
  rowRef: RefObject<HTMLElement>
  value: MetaGroupChild
  canInner?: boolean
  top?: string
  toptop?: string
}) => {
  const { rowRef, top = 'calc( 100% + 1px )', toptop = '0px' } = opts
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
          const isDraggingInLink = checkDragInLinks(e)
          const bounding = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
          const { clientY } = e
          let position: 'top' | 'bottom' | 'inner' | undefined = undefined
          if (!isDraggingInLink) {
            const offsetY = clientY - bounding.top
            const heightBreakpoint = bounding.height / 3
            if (offsetY < heightBreakpoint) position = 'top'
            else if (offsetY > heightBreakpoint * 2) {
              position = 'bottom'
            } else {
              position = 'inner'
            }
          }
          if (position === 'inner') {
            return
          }
          instance.dragOps?.setCurrentDragDetails?.({
            value: opts.value,
            towards: position
          })
          setDraggingIndicator({
            position,
            inLink: isDraggingInLink || undefined
          })
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
    return (
      <AnimatePresence>
        {pos && (
          <motion.div
            style={{
              position: 'absolute',
              background: Colors.Common.SelectColorTransparent,
              pointerEvents: 'none',
              left: 0,
              width: '100%',
              borderRadius: 4,
              height: pos === 'inner' ? '100%' : 4,
              top: pos === 'top' ? toptop : pos === 'bottom' ? top : 0
            }}
            key={pos}
            initial={{ opacity: 0 }}
            transition={{ damping: 0, duration: 0.15 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          ></motion.div>
        )}
      </AnimatePresence>
    )
  }

  return {
    renderIndicator
  }
}

export default useDragInRow
