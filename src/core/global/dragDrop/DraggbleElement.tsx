import { useMemoizedFn } from '@/hooks'
import { cloneElement, forwardRef, ReactElement, useCallback, useEffect, useRef } from 'react'
import { IDraggableElement } from '~/typings'

const DraggableElement = forwardRef<
  HTMLElement,
  {
    children: ReactElement
    draggingDetails?: IDraggableElement
    draggable?: boolean
    onDragStart?: VoidFunction
    hoverElement?: ReactElement | HTMLElement
    shouldPress?: number
    dragHandleClassName?: string
  }
>(({ children, draggingDetails, draggable = true, hoverElement, onDragStart, dragHandleClassName, shouldPress = 60 }, externalRef) => {
  const isPressed = useRef(false)
  const pressStartTime = useRef(0)
  const childRef = useRef<HTMLElement | undefined>()
  const dragStartTriggered = useRef(false)
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (draggable === false) return
    if (e.type === 'pointerdown') {
      if (e.button !== 0) return
      ;(e.target as Element).releasePointerCapture(e.pointerId)
      isPressed.current = true
      pressStartTime.current = Date.now()
      dragStartTriggered.current = false
      const child = childRef.current
      e.preventDefault()

      if (hoverElement && !(hoverElement instanceof HTMLElement)) {
        draggingDetails && (Global.values.draggingDetails = draggingDetails)
        Global.commonOps?.setDraggingElements?.(hoverElement)
        return
      }
      const ele = hoverElement instanceof HTMLElement ? hoverElement : child
      if (ele) {
        const cloned = ele.cloneNode(true) as HTMLElement
        const bound = ele.getBoundingClientRect()
        cloned.style.width = `${bound.width}px`
        cloned.style.height = `${bound.height}px`
        cloned.style.pointerEvents = 'none'
        draggingDetails && (Global.values.draggingDetails = draggingDetails)
        Global.commonOps?.setDraggingElements?.(cloned)
      }
    }
    if (e.type === 'pointermove') {
      if (isPressed.current && draggable && Date.now() - pressStartTime.current > shouldPress) {
        if (dragStartTriggered.current === false) {
          Global.commonOps?.startDrag?.()
          onDragStart?.()
        }
        e.preventDefault()
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
    if (dragHandleClassName) {
      const node = childRef.current?.getElementsByClassName(dragHandleClassName)[0]
      if (node && node instanceof HTMLElement) {
        node.addEventListener('pointerdown', pointerHandler)
        node.addEventListener('pointermove', pointerHandler)
        document.addEventListener('pointerup', pointerHandler, true)
        return () => {
          node.removeEventListener('pointerdown', pointerHandler)
          node.removeEventListener('pointermove', pointerHandler)
          document.removeEventListener('pointerup', pointerHandler, true)
        }
      }
    }
    childRef.current?.addEventListener('pointerdown', pointerHandler)
    childRef.current?.addEventListener('pointermove', pointerHandler)
    document.addEventListener('pointerup', pointerHandler, true)
    return () => {
      childRef.current?.removeEventListener('pointerdown', pointerHandler)
      childRef.current?.removeEventListener('pointermove', pointerHandler)
      document.removeEventListener('pointerup', pointerHandler, true)
    }
  })
  return cloneElement(children, {
    ref: handleRef
  })
})

export default DraggableElement
