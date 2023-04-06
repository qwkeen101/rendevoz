import { getDistanceBetweenPointAndElement } from '@/utils'
import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/core'
import { GlobalEventHandler } from '@/events/globalEvent'
import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import { ObjectStore } from '@/stores'
import Id from '@/utils/id'
import { useEffect, useState } from 'react'
import { ILabel, IObjectLabel, IShapeLabel, MetaObject } from '~/typings/data'

const usePdfDrag = (viewbox: HTMLElement | null | undefined, pdfId: number) => {
  const [isGlobalDragging] = useGlobalIsDragging()
  const [isDraggingInside, setIsDraggingInside] = useState(false)
  const globalEmitter = useGlobalEventEmitter()
  const mouseEnterHandler = useMemoizedFn((e: MouseEvent) => {
    setIsDraggingInside(true)
  })
  const mouseLeaveHandler = useMemoizedFn((e: MouseEvent) => {
    setIsDraggingInside(false)
  })

  const mouseMoveHandler = useMemoizedFn((e: MouseEvent) => {
    !isDraggingInside && setIsDraggingInside(true)
  })
  const mouseUpHandler = useMemoizedFn((e: PointerEvent) => {
    let target = e.target
    if (target instanceof HTMLElement && viewbox?.contains(target) && target.getAttribute('role') === 'text-layer') {
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
          const label: Partial<ILabel> = {
            id: Id.getId(),
            page,
            documentId: pdfId,
            rect: [ratioDistance.top, ratioDistance.left]
          }
          if (globalDraggingEle.type === 'pendingPdfElement') {
            label.type = globalDraggingEle.labelType
            switch (globalDraggingEle.labelType) {
              case 'shape': {
                Object.assign(label, {
                  shape: globalDraggingEle.shapeType
                } as IShapeLabel)
              }
            }
            ObjectStore('pdfLabel').addOne(label)
          } else {
            globalEmitter
              .emitWithCallback('global', {
                type: 'globalDropNeedFurtherProcess',
                data: {
                  dropOn: {
                    dropOn: 'pdf',
                    pdfId: pdfId
                  },
                  draggingElement: globalDraggingEle
                }
              })
              .then((obj: MetaObject) => {
                label.type = 'object'
                Object.assign(label, { metaObjectId: obj.id } as IObjectLabel)
                ObjectStore('pdfLabel').addOne(label)
              })
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
    const globalHandler = new GlobalEventHandler()
    globalHandler.on('globalDragPointerUp', ({ event }) => {
      mouseUpHandler(event)
    })
    globalEmitter.addListener('global', globalHandler)
    return () => {
      globalEmitter.removeListener('global', globalHandler)
    }
  }, [])
  return {
    isDraggingInside
  }
}

export default usePdfDrag
