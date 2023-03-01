import { getDistanceBetweenPointAndElement } from '@/components/dragReposition/utils/position'
import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/components/globalDragOverlay/GlobalDragOverlay'
import { useMemoizedFn } from '@/hooks'
import Id from '@/utils/id'
import { useEffect, useState } from 'react'
import { IThoughtLabel } from '~/typings/data'

const usePdfDrag = (viewbox: HTMLElement | null | undefined) => {
  const [isGlobalDragging] = useGlobalIsDragging()
  const [isDraggingInside, setIsDraggingInside] = useState(false)
  const mouseEnterHandler = useMemoizedFn((e: MouseEvent) => {
    setIsDraggingInside(true)
  })
  const mouseLeaveHandler = useMemoizedFn((e: MouseEvent) => {
    setIsDraggingInside(false)
  })

  const mouseMoveHandler = useMemoizedFn((e: MouseEvent) => {
    !isDraggingInside && setIsDraggingInside(true)
  })
  const mouseUpHandler = useMemoizedFn((e: MouseEvent) => {
    let target = e.target
    if (target instanceof HTMLElement) {
      while (!target.hasAttribute('data-page-index') && target.parentElement && target !== e.currentTarget) {
        target = target.parentElement as HTMLElement
      }
      const pageEle = target as HTMLElement
      if (pageEle.hasAttribute('data-page-index')) {
        const page = Number(pageEle.getAttribute('data-page-index'))
        const distance = getDistanceBetweenPointAndElement(e, pageEle)
        const pageRect = pageEle.getBoundingClientRect()
        const ratioDistance = {
          top: distance.top / pageRect.height,
          left: distance.left / pageRect.width
        }
        const globalDraggingEle = GlobalDragOverlayInstance?.draggingDetails
        GlobalDragOverlayInstance.draggingDetails = undefined
        if (globalDraggingEle) {
          const label: IThoughtLabel = {
            id: Id.getId(),
            page,
            rect: [ratioDistance.top, ratioDistance.left],
            position: 'right',
            type: 'thought'
          }
          switch (globalDraggingEle.type) {
            case 'noteElement':
              label.originFrom = 'editor'
              label.content = globalDraggingEle.elements || globalDraggingEle.element
              label.originId = globalDraggingEle.noteId
              break
            case 'pdfElement':
              label.content = globalDraggingEle.content
              label.originFrom = 'pdf'
              label.originId = globalDraggingEle.pdfId
              break
            case 'metaElement':
              label.originFrom = 'meta'
              label.originId = globalDraggingEle.metaId
              break
            case 'image':
              label.originFrom = 'image'
              label.content = globalDraggingEle.url
          }
        }
      }
    }
  })
  useEffect(() => {
    if (isGlobalDragging) {
      viewbox?.addEventListener('mouseenter', mouseEnterHandler)
      viewbox?.addEventListener('mouseleave', mouseLeaveHandler)
      viewbox?.addEventListener('mousemove', mouseMoveHandler)
      return () => {
        viewbox?.removeEventListener('mouseenter', mouseEnterHandler)
        viewbox?.removeEventListener('mouseleave', mouseLeaveHandler)
        viewbox?.removeEventListener('mousemove', mouseMoveHandler)
      }
    } else {
      setIsDraggingInside(false)
    }
  }, [isGlobalDragging])
  useEffect(() => {
    if (isDraggingInside) {
      viewbox?.addEventListener('mousemove', mouseMoveHandler)
      viewbox?.addEventListener('mouseup', mouseUpHandler)
      return () => {
        viewbox?.removeEventListener('mousemove', mouseMoveHandler)
        viewbox?.removeEventListener('mouseup', mouseUpHandler)
      }
    }
  }, [isDraggingInside])
  return {
    isDraggingInside
  }
}

export default usePdfDrag
