import { RefObject, useEffect, useState } from 'react'
import { useGlobalIsDragging } from '@/core'
import checkDragInLinks from '@/core/group/hooks/drag/checkDragInLinks'
import { useTableInstance } from '@/core/group/hooks/useTableInstance'
import { Colors } from '@/consts'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import { MetaGroupChild } from '~/typings'

const useDragInRow = (opts: { rowRef: RefObject<HTMLElement>; value: MetaGroupChild }) => {
  const { rowRef, metaId, path } = opts
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
    if (draggingIndicator) {
      if (draggingIndicator.position === 'top') {
        return (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              pointerEvents: 'none',
              height: 4,
              background: Colors.Common.SelectColorTransparent
            }}
          ></div>
        )
      } else if (draggingIndicator.position === 'bottom') {
        return (
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: 0,
              pointerEvents: 'none',
              width: '100%',
              height: 4,
              background: Colors.Common.SelectColorTransparent
            }}
          ></div>
        )
      } else if (draggingIndicator.position === 'inner') {
        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: Colors.Common.SelectColorTransparent
            }}
          ></div>
        )
      }
    } else {
      return null
    }
  }

  return {
    renderIndicator
  }
}

export default useDragInRow
