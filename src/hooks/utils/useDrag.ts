import { GlobalDragOverlayInstance } from '@/components/globalDragOverlay/GlobalDragOverlay'
import { MouseEventHandler, useEffect } from 'react'
import useMemoizedFn from './useMemoizedFn'

const useDrag = (dragElement?: HTMLElement | null) => {
  const mouseDownHandler = useMemoizedFn((e: MouseEvent) => {
    if (dragElement) {
      const cloned = dragElement.cloneNode(true) as HTMLElement
      const rect = dragElement.getBoundingClientRect()
      cloned.style.width = `${rect.width}px`
      cloned.style.height = `${rect.height}px`
      cloned.style.left = `0px`
      cloned.style.top = `0px`
      cloned.style.position = 'relative'
      GlobalDragOverlayInstance?.addDragElements(cloned)
      GlobalDragOverlayInstance?.startDrag()
      document.addEventListener('mouseup', mouseUpHandler)
    }
  })

  const mouseUpHandler = useMemoizedFn((e: MouseEvent) => {
    // GlobalDragOverlayInstance?.endDrag()
    document.removeEventListener('mousedown', mouseDownHandler)
    document.removeEventListener('mouseup', mouseUpHandler)
  })
  useEffect(() => {
    dragElement?.addEventListener('mousedown', mouseDownHandler)
  })
}

export default useDrag
