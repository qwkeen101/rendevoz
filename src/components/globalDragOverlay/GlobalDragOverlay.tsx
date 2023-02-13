import { useMemoizedFn } from '@/hooks'
import { GlobalScope } from '@/jotai/jotaiScope'
import { css } from '@emotion/css'
import { atom, useAtom } from 'jotai'
import { memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Path } from 'slate'
import { CustomElement } from '../editor/types'
import useOverlayDrop from './useOverlayDrop'

export type AvaliableGlobalDraggingElements =
  | {
      type: 'noteElement'
      blockId: number
      element: CustomElement
      path: Path
      elements: CustomElement[]
      content: string
      noteId: number
      editorId: string
    }
  // something inside pdf, not pdf itself
  | {
      type: 'pdfElement'
      labelId: number
      pdfId: number
      content: string
      page: number
    }
  | {
      type: 'metaElement'
      metaId: number
    }
  // pdf itself
  | {
      type: 'pdf'
      pdfId: number
    }
  | {
      type: 'collection'
      collectionId: number
    }
  | {
      type: 'note'
      noteId: number
    }
  | {
      type: 'image'
      url: string
    }
interface IGlobalDragOverlay {
  addDragElements: (nodes: HTMLElement | HTMLElement[]) => void
  startDrag: () => void
  endDrag: () => void
  removeDragElements: (nodes: HTMLElement | HTMLElement[]) => void
  removeAllDragElement: () => void
  draggingDetails?: Partial<AvaliableGlobalDraggingElements>
}
export const GlobalDragOverlayInstance: Partial<IGlobalDragOverlay> = {}
const globalIsDraggingAtom = atom(false)
export const useGlobalIsDragging = () => useAtom(globalIsDraggingAtom, GlobalScope)
const GlobalDragOverlay = memo(() => {
  const [dragElements, setDragElements] = useState<HTMLElement[]>([])
  const [isDragging, setIsDragging] = useGlobalIsDragging()
  const { portal } = useOverlayDrop()
  const dragContainerRef = useRef<HTMLDivElement>(null)
  const dragHandler = useMemoizedFn((e: MouseEvent) => {
    if (e.type === 'pointerup') {
      setDragElements([])
      setTimeout(() => setIsDragging(false), 0)
      setTimeout(() => (GlobalDragOverlayInstance.draggingDetails = undefined), 20)
      return
    }
    e.preventDefault()
    const dragContainer = dragContainerRef.current
    if (!dragContainer) return
    const { clientX, clientY } = e
    dragContainer.style.transform = `translateX(${clientX}px) translateY(${clientY}px)`
    dragContainer.style.display = 'block'
  })

  useEffect(() => {
    const dragContainer = dragContainerRef.current
    if (!dragContainer) return
    document.addEventListener('pointerup', dragHandler, true)
    if (isDragging) {
      document.body.style.cursor = 'grabbing'
      document.addEventListener('pointermove', dragHandler, true)
    } else {
      document.body.style.cursor = 'auto'
      document.removeEventListener('pointermove', dragHandler, true)
      dragContainer.style.display = 'none'
      // GlobalDragOverlayInstance.draggingDetails = undefined
    }
    return () => {
      document.removeEventListener('pointerup', dragHandler, true)
    }
  }, [isDragging])
  useEffect(() => {
    if (dragElements.length === 0) {
      while (dragContainerRef.current?.firstChild) {
        dragContainerRef.current.removeChild(dragContainerRef.current.firstChild)
      }
    } else {
      dragContainerRef.current?.replaceChildren(...dragElements)
    }
  }, [dragElements])
  Object.assign(GlobalDragOverlayInstance, {
    addDragElements: nodes => {
      if (!Array.isArray(nodes)) {
        nodes = [nodes]
      }
      if (!isDragging) {
        setDragElements([...dragElements, ...nodes])
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
      setIsDragging(true)
    },
    endDrag: () => {
      setIsDragging(false)
    }
  } as Partial<IGlobalDragOverlay>)
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
        <div style={{ opacity: 0.5 }} ref={dragContainerRef}></div>
      </div>
      {portal}
    </>,
    document.body,
    'globla-drag-overlay'
  )
})

export default GlobalDragOverlay
