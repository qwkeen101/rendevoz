import { useMemoizedFn } from '@/hooks'
import { css } from '@emotion/css'
import { atom } from 'jotai/vanilla'
import { useAtom } from 'jotai/react'
import React from 'react'
import { memo, ReactElement, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GlobalDraggingDetails, GlobalInstances } from '~/typings'
import useOverlayDrop from './useOverlayDrop'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { Rendevoz } from '@/core/rendevoz'
import { assignProperties } from '@/utils'

export type AvaliableGlobalDraggingElements = GlobalDraggingDetails

export const GlobalDragOverlayInstance: Partial<GlobalInstances.DragDropInstance> = {}

const globalIsDraggingAtom = atom(false)
export const useGlobalIsDragging = () => useAtom(globalIsDraggingAtom, { store: globalStore })
export const GlobalDragOverlay = memo(() => {
  const [dragElements, setDragElements] = useState<(HTMLElement | ReactElement)[]>([])
  const [isDragging, setIsDragging] = useGlobalIsDragging()
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const { portal } = useOverlayDrop()
  const dragContainerRef = useRef<HTMLDivElement>(null)
  const dragHandler = useMemoizedFn((e: PointerEvent) => {
    if (e.type === 'pointerup') {
      setDragElements(eles => {
        if (eles.length > 0) {
          return []
        }
        return eles
      })
      isDragging &&
        GlobalDragOverlayInstance.draggingDetails &&
        emitter.emit('global', {
          type: 'globalDragPointerUp',
          data: {
            event: e,
            draggingElement: GlobalDragOverlayInstance.draggingDetails
          }
        })
      setTimeout(() => setIsDragging(false), 0)
      setTimeout(() => (GlobalDragOverlayInstance.draggingDetails = undefined), 20)
      return
    }
    if (e.type === 'pointermove') {
      GlobalDragOverlayInstance.draggingDetails &&
        emitter.emit('global', {
          type: 'globalDragPointerMove',
          data: {
            event: e,
            draggingElement: GlobalDragOverlayInstance.draggingDetails
          }
        })
    }
    e.preventDefault()
    window.getSelection()?.empty()
    const dragContainer = dragContainerRef.current
    if (!dragContainer) return
    const { clientX, clientY } = e
    dragContainer.style.transform = `translateX(${clientX + 4}px) translateY(${clientY + 4}px)`
    dragContainer.style.display = 'block'
  })
  const dropHandler = (e: DragEvent) => {
    GlobalDragOverlayInstance.draggingDetails = undefined
    setIsDragging(false)
    e.preventDefault()
    emitter.emit('global', {
      type: 'globalDragPointerUp',
      data: {
        event: e
      }
    })
  }
  const dragoverHandler = () => {
    setIsDragging(true)
  }
  useEffect(() => {
    const dragContainer = dragContainerRef.current
    if (!dragContainer) return
    document.addEventListener('pointerup', dragHandler, true)
    document.addEventListener('drop', dropHandler, true)
    document.addEventListener('dragover', dragoverHandler, true)
    if (isDragging) {
      document.body.style.cursor = 'grabbing'
      document.body.classList.add(ClassName.disableUserSelect)
      document.addEventListener('pointermove', dragHandler, true)
    } else {
      document.body.style.cursor = 'auto'
      document.removeEventListener('pointermove', dragHandler, true)
      dragContainer.style.display = 'none'
      // GlobalDragOverlayInstance.draggingDetails = undefined
    }
    return () => {
      document.removeEventListener('dragover', dragoverHandler, true)
      document.body.classList.remove(ClassName.disableUserSelect)
      document.removeEventListener('drop', dropHandler, true)
      document.removeEventListener('pointerup', dragHandler, true)
    }
  }, [isDragging])
  useEffect(() => {
    console.log(dragElements)
    if (dragElements.length === 0) {
      while (dragContainerRef.current?.firstChild) {
        dragContainerRef.current.removeChild(dragContainerRef.current.firstChild)
      }
    } else {
      dragElements.forEach(ele => {
        if (ele instanceof HTMLElement) {
          dragContainerRef.current?.appendChild(ele)
        }
      })
    }
  }, [dragElements])
  assignProperties(GlobalDragOverlayInstance, {
    addDragElements: nodes => {
      let newNodes = nodes

      if (!Array.isArray(newNodes)) {
        newNodes = [nodes] as any[]
      }
      if (!isDragging) {
        setDragElements([...dragElements, ...newNodes])
      }
    },
    removeAllDragElement: () => {
      setDragElements([])
    },
    removeDragElements: nodes => {
      if (!Array.isArray(nodes)) {
        nodes = [nodes]
      }
      setDragElements(els => {
        return els.filter(el => (nodes as HTMLElement[]).some(n => n !== el))
      })
    },
    startDrag: () => {
      if (isDragging === false) {
        setIsDragging(true)
      }
    },
    endDrag: () => {
      setIsDragging(false)
    },
    setDraggingDetails: d => (GlobalDragOverlayInstance.draggingDetails = d),
    getDraggingDetails: () => GlobalDragOverlayInstance.draggingDetails
  })
  return createPortal(
    <>
      <div
        className={css({
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          pointerEvents: 'none'
        })}
        role="global-drag-overlay"
      >
        <div style={{ opacity: 0.65, pointerEvents: 'none' }} ref={dragContainerRef}>
          {dragElements.map(i => {
            if (React.isValidElement(i)) {
              return i
            }
          })}
        </div>
      </div>
      {portal}
    </>,
    document.body,
    'globla-drag-overlay'
  )
})

export * from './makeDragElements'
export * from './DraggingElement'
