import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/components/globalDragOverlay'
import { useMemoizedFn } from '@/hooks'
import useMetaStore from '@/stores/meta.store'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { MetaObject } from '~/typings/data'

const useCardDrag = (metaObject: MetaObject, draggableElement?: HTMLElement | null, showElement?: HTMLElement | null) => {
  const [isGlobalDragging] = useGlobalIsDragging()
  const [isCardDraggingInside, setIsCardDraggingInside] = useState(false)
  const isPressed = useRef(false)
  const { addMetaLink } = useMetaStore()
  const mouseDownHandler = (e: MouseEvent) => {
    const cloned = showElement?.cloneNode(true) as HTMLElement
    cloned.style.width = `${showElement?.clientWidth}px`
    cloned.style.height = `${showElement?.clientHeight}px`
    if (cloned && GlobalDragOverlayInstance) {
      GlobalDragOverlayInstance.addDragElements(cloned)
      GlobalDragOverlayInstance.draggingDetails = {
        type: 'metaElement',
        metaId: metaObject.id
      }
    }
    isPressed.current = true
  }

  const mouseMoveHandler = useMemoizedFn((e: MouseEvent) => {
    if (isPressed.current) {
      GlobalDragOverlayInstance?.startDrag()
    }
  })
  const mouseUpHandler = () => {
    isPressed.current = false
  }
  const showElementMouseHandler = (e: MouseEvent) => {
    if (isGlobalDragging) {
      if (e.type === 'mouseenter') {
        if (GlobalDragOverlayInstance?.draggingDetails?.metaId !== metaObject.id) {
          setIsCardDraggingInside(true)
        }
      }
      if (e.type === 'mouseleave') {
        setIsCardDraggingInside(false)
      }
    }
  }
  useEffect(() => {
    if (!isGlobalDragging) {
      isPressed.current = false
      if (isCardDraggingInside) {
        const draggingEle = GlobalDragOverlayInstance?.draggingDetails
        GlobalDragOverlayInstance.draggingDetails = undefined
        if (draggingEle && draggingEle.type === 'metaElement') {
          addMetaLink({
            sourceId: draggingEle.metaId,
            sourceType: 'knowledge',
            targetId: metaObject.id,
            targetType: 'knowledge'
          })
          toast.success('Link added!')
        }
        setIsCardDraggingInside(false)
      }
    }
  }, [isGlobalDragging])

  useEffect(() => {
    if (draggableElement) {
      draggableElement?.addEventListener('mousedown', mouseDownHandler)
      draggableElement?.addEventListener('mousemove', mouseMoveHandler)
      showElement?.addEventListener('mouseenter', showElementMouseHandler)
      showElement?.addEventListener('mouseleave', showElementMouseHandler)
      document.addEventListener('mouseup', mouseUpHandler)
      return () => {
        draggableElement?.removeEventListener('mousedown', mouseDownHandler)
        draggableElement?.removeEventListener('mousemove', mouseMoveHandler)
        showElement?.removeEventListener('mouseenter', showElementMouseHandler)
        showElement?.removeEventListener('mouseleave', showElementMouseHandler)
        document.removeEventListener('mouseup', mouseUpHandler)
      }
    }
  })
  return {
    isCardDraggingInside
  }
}

export default useCardDrag
