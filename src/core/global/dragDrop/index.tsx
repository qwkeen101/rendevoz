import { useMemoizedFn } from '@/hooks'
import { atom } from 'jotai/vanilla'
import { useAtom } from 'jotai/react'
import React, { memo, ReactElement, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { globalStore } from '@/api/stores'
import ClassName from '@/styles/classNames'
import { assignProperties } from '@/utils'

const globalIsDraggingAtom = atom(false)
export const useGlobalIsDragging = () => useAtom(globalIsDraggingAtom, { store: globalStore })
export const isGlobalDragging = () => globalStore.get(globalIsDraggingAtom)
export const GlobalDragOverlay = memo(() => {
  const [dragElements, setDragElements] = useState<(HTMLElement | ReactElement)[]>([])
  const [isDragging, setIsDragging] = useGlobalIsDragging()
  const dragContainerRef = useRef<HTMLDivElement>(null)
  const dragHandler = useMemoizedFn((e: PointerEvent) => {
    const draggingDetails = Global.values.draggingDetails
    if (e.type === 'pointerup') {
      if (isDragging) {
        setDragElements(eles => {
          if (eles.length > 0) {
            return []
          }
          return eles
        })
        draggingDetails &&
          Global.emitEvent('dragEnd', {
            event: e
          })
        setTimeout(() => setIsDragging(false), 0)
        setTimeout(() => (Global.values.draggingDetails = undefined), 20)
      }
      return
    }
    if (e.type === 'pointermove' && draggingDetails) {
      Global.emitEvent('dragMove', {
        event: e
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
    Global.values.draggingDetails = undefined
    setIsDragging(false)
    e.preventDefault()
    Global.emitEvent('dragEnd', {
      event: e
    })
  }
  const dragoverHandler = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  assignProperties(Global, {
    commonOps: {
      ...Global.commonOps,
      startDrag: () => {
        if (isDragging === false) {
          setIsDragging(true)
        }
      },
      setDraggingElements: nodes => {
        let newNodes = nodes

        if (!Array.isArray(newNodes)) {
          newNodes = [nodes] as any[]
        }
        if (!isDragging) {
          setDragElements([...dragElements, ...newNodes])
        }
      }
    }
  })
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
    }
    return () => {
      document.removeEventListener('dragover', dragoverHandler, true)
      document.body.classList.remove(ClassName.disableUserSelect)
      document.removeEventListener('drop', dropHandler, true)
      document.removeEventListener('pointerup', dragHandler, true)
    }
  }, [isDragging])
  useEffect(() => {
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

  return createPortal(
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          pointerEvents: 'none'
        }}
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
    </>,
    document.body
  )
})

export * from './makeDragElements'
export * from './DraggingElement'
