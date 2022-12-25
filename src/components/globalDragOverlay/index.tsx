import { GlobalScope } from '@/jotai/jotaiScope'
import { css } from '@emotion/css'
import { atom, useAtom } from 'jotai'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type AvaliableGlobalDraggingElements =
  | {
      type: 'editorElement'
      blockId: number
      content: string
      noteId: number
    }
  | {
      type: 'pdfElement'
      pdfId: number
      content: string
      page: number
    }
  | {
      type: 'metaElement'
      metaId: number
    }
interface IGlobalDragOverlay {
  addDragElements: (nodes: HTMLElement | HTMLElement[]) => void
  startDrag: () => void
  endDrag: () => void
  removeDragElements: (nodes: HTMLElement | HTMLElement[]) => void
  removeAllDragElement: () => void
  draggingDetails?: Partial<AvaliableGlobalDraggingElements>
}
export let GlobalDragOverlayInstance: IGlobalDragOverlay | undefined = undefined
const globalIsDraggingAtom = atom(false)
export const useGlobalIsDragging = () => useAtom(globalIsDraggingAtom, GlobalScope)
const GlobalDragOverlay = memo(() => {
  const [dragElements, setDragElements] = useState<HTMLElement[]>([])
  const [isDragging, setIsDragging] = useGlobalIsDragging()
  const dragContainerRef = useRef<HTMLDivElement>(null)
  const dragHandler = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      if (e.type === 'mouseup') {
        console.log('up')
        setDragElements([])
        setIsDragging(false)
        return
      }
      const dragContainer = dragContainerRef.current
      if (!dragContainer) return
      const { clientX, clientY } = e
      dragContainer.style.transform = `translateX(${clientX}px) translateY(${clientY}px)`
      dragContainer.style.display = 'block'
    },
    [dragContainerRef]
  )

  useEffect(() => {
    const dragContainer = dragContainerRef.current
    if (!dragContainer) return
    document.addEventListener('mouseup', dragHandler)
    if (isDragging) {
      document.body.style.cursor = 'grabbing'
      document.addEventListener('mousemove', dragHandler)
    } else {
      document.body.style.cursor = 'auto'
      document.removeEventListener('mousemove', dragHandler)
      dragContainer.style.display = 'none'
      setDragElements([])
    }
    return () => {
      document.removeEventListener('mouseup', dragHandler)
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
  GlobalDragOverlayInstance = {
    ...GlobalDragOverlayInstance,
    addDragElements: nodes => {
      if (!Array.isArray(nodes)) {
        nodes = [nodes]
      }
      if (!isDragging) {
        console.log('asdasda')
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
  }
  return createPortal(
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
    </div>,
    document.body,
    'globla-drag-overlay'
  )
})

export default GlobalDragOverlay
