import { RefObject, useEffect, useState } from 'react'
import { useGlobalIsDragging } from '@/core'
import checkDragInLinks from '@/core/components/group/hooks/drag/checkDragInLinks'
import { Colors } from '@/consts'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaGroupChild } from '~/typings'
import { motion } from 'framer-motion'
const useDragInRow = (opts: { rowRef: RefObject<HTMLElement>; value: MetaGroupChild }) => {
  const { rowRef } = opts
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
    if (draggingIndicator?.position) {
      const pos = draggingIndicator.position
      return (
        <motion.div
          style={{ position: 'absolute', background: Colors.Common.SelectColorTransparent, pointerEvents: 'none', left: 0 }}
          initial={{ opacity: 1, width: '100%', top: pos === 'top' ? 0 : pos === 'bottom' ? 'calc(100% + 1px)' : 0, height: 4 }}
          transition={{ damping: 0, duration: 0.15 }}
          animate={{ height: pos === 'inner' ? '100%' : 4, top: pos === 'top' ? 0 : pos === 'bottom' ? 'calc(100% + 1px)' : 0 }}
          exit={{ opacity: 0 }}
        ></motion.div>
      )
    } else {
      return null
    }
  }

  return {
    renderIndicator
  }
}

export default useDragInRow
