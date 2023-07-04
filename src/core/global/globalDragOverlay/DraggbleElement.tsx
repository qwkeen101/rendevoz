import { useMemoizedFn } from '@/hooks'
import { cloneElement, forwardRef, ReactElement, useCallback, useEffect, useRef } from 'react'
import { GlobalDragOverlayInstance } from '.'
import { IDraggableElement } from '~/typings/globalInstances/dragDrop'

const DraggableElement = forwardRef<
  HTMLElement,
  {
    children: ReactElement
    draggingDetails?: IDraggableElement
    draggable?: boolean
    onDragStart?: VoidFunction
    hoverElement?: ReactElement
    shouldPress?: number
  }
>(({ children, draggingDetails, draggable = true, hoverElement, onDragStart, shouldPress = 60 }, externalRef) => {
  const isPressed = useRef(false)
  const pressStartTime = useRef(0)
  const childRef = useRef<HTMLElement | undefined>()
  const dragStartTriggered = useRef(false)
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (e.type === 'pointerdown') {
      isPressed.current = true
      pressStartTime.current = Date.now()
      dragStartTriggered.current = false
      const child = childRef.current

      if (hoverElement) {
        draggingDetails && (GlobalDragOverlayInstance.draggingDetails = draggingDetails)
        GlobalDragOverlayInstance.addDragElements?.(hoverElement)
        return
      }
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
      if (isPressed.current && draggable && Date.now() - pressStartTime.current > shouldPress) {
        GlobalDragOverlayInstance.startDrag?.()
        if (dragStartTriggered.current === false) {
          onDragStart?.()
        }
        dragStartTriggered.current = true
      }
    }
    if (e.type === 'pointerup') {
      isPressed.current = false
      dragStartTriggered.current = false
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
