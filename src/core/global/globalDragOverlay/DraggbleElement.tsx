import { useMemoizedFn } from '@/hooks'
import { cloneElement, forwardRef, ReactElement, useCallback, useEffect, useRef } from 'react'
import { AvaliableGlobalDraggingElements, GlobalDragOverlayInstance } from '.'

const DraggableElement = forwardRef<
  HTMLElement,
  {
    children: ReactElement
    draggingDetails?: AvaliableGlobalDraggingElements
    draggable?: boolean
  }
>(({ children, draggingDetails, draggable = true }, externalRef) => {
  const isPressed = useRef(false)
  const childRef = useRef<HTMLElement | undefined>()
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (e.type === 'pointerdown') {
      isPressed.current = true
      const child = childRef.current
      if (child) {
        const cloned = child.cloneNode(true) as HTMLElement
        const bound = child.getBoundingClientRect()
        cloned.style.width = `${bound.width}px`
        cloned.style.height = `${bound.height}px`
        cloned.style.pointerEvents = 'none'
        draggingDetails && (GlobalDragOverlayInstance.draggingDetails = draggingDetails)
        GlobalDragOverlayInstance.addDragElements?.(cloned)
      }
    }
    if (e.type === 'pointermove') {
      if (isPressed.current && draggable) {
        GlobalDragOverlayInstance.startDrag?.()
      }
    }
    if (e.type === 'pointerup') {
      isPressed.current = false
    }
  })

  const handleRef = useCallback(
    (node: HTMLElement) => {
      childRef.current = node
      if (externalRef != null) {
        if (typeof externalRef === 'object') {
          ;(externalRef as React.MutableRefObject<HTMLElement>).current = node
        } else if (typeof externalRef === 'function') {
          ;(externalRef as (instance: HTMLElement) => void)(node)
        }
      }
    },
    [externalRef]
  )
  useEffect(() => {
    childRef.current?.addEventListener('pointerdown', pointerHandler)
    childRef.current?.addEventListener('pointermove', pointerHandler)
    document.addEventListener('pointerup', pointerHandler)
    return () => {
      childRef.current?.removeEventListener('pointerdown', pointerHandler)
      childRef.current?.removeEventListener('pointermove', pointerHandler)
      document.removeEventListener('pointerup', pointerHandler)
    }
  }, [])
  const renderChild = () =>
    cloneElement(children as JSX.Element, {
      ref: handleRef
    })
  return renderChild()
})

export default DraggableElement
