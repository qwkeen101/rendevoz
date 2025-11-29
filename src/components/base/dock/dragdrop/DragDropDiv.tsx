import React, { forwardRef, useEffect, useRef } from 'react'
import * as DragManager from './DragManager'
import { Point } from '~/typings'
import { useMergedRef } from '@/hooks'

type DragDropDivProps = {
  className?: string
  onDragStartT?: DragManager.DragHandler
  onDragMoveT?: DragManager.DragHandler
  onDragEndT?: DragManager.DragHandler
  onDragOverT?: DragManager.DragHandler
  onDragLeaveT?: DragManager.DragHandler
  onDropT?: DragManager.DragHandler
  children?: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>

const DragDropDiv = forwardRef<HTMLDivElement, DragDropDivProps>((props, ref) => {
  const { className, onDragStartT, onDragMoveT, onDragEndT, onDragOverT, onDragLeaveT, onDropT, children, ...others } = props
  const elementRef = useRef<HTMLDivElement>(null)
  const mergedRef = useMergedRef(elementRef, ref)
  const pointerDownTime = useRef<number>()
  const listening = useRef(false)
  const waitingMove = useRef(false)
  const initialPosition = useRef<Point>()
  const cancel = () => {
    if (listening.current) {
      onDragEnd()
    }
  }
  const checkCanMove = () => {
    const now = Date.now()
    if (pointerDownTime.current && now - pointerDownTime.current > 100) return true
    return false
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      cancel()
    }
  }
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    others.onPointerDown?.(e)
    pointerDownTime.current = Date.now()
    cancel()
    if (onDragStartT) {
      initialPosition.current = {
        x: e.pageX,
        y: e.pageY
      }
      if (DragManager.isDragging()) {
        return
      }
      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onDragEnd)
      waitingMove.current = true
      listening.current = true
    }
  }
  const checkFirstMove = (e: PointerEvent) => {
    if (!initialPosition.current) return false
    const state = new DragManager.DragState(e, initialPosition.current, true)
    if (!state.moved()) {
      // not a move
      return false
    }
    return executeFirstMove(state)
  }

  const executeFirstMove = (state: DragManager.DragState): boolean => {
    waitingMove.current = false
    onDragStartT?.(state)
    if (!DragManager.isDragging()) {
      onDragEnd()
      return false
    }
    state._onMove()
    document.addEventListener('keydown', onKeyDown)
    return true
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!checkCanMove()) return
    if (waitingMove.current) {
      if (DragManager.isDragging()) {
        onDragEnd()
        return
      }
      if (!checkFirstMove(e)) {
        return
      }
    } else {
      if (initialPosition.current) {
        const state = new DragManager.DragState(e, initialPosition.current)
        state._onMove()
        if (onDragMoveT) {
          onDragMoveT(state)
        }
      }
    }
    e.preventDefault()
  }

  const onDragEnd = (e?: PointerEvent) => {
    const state = new DragManager.DragState(e, initialPosition.current)
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onDragEnd)
    document.removeEventListener('keydown', onKeyDown)
    listening.current = false

    if (!waitingMove.current) {
      // e=null means drag is canceled
      state._onDragEnd(e == null)
      if (onDragEndT) {
        onDragEndT(state)
      }
    }
    waitingMove.current = false
  }

  useEffect(() => {
    const ele = elementRef.current
    if (ele) {
      DragManager.addHandlers(ele, {
        onDragLeaveT,
        onDragOverT,
        onDropT
      })
      return () => DragManager.removeHandlers(ele)
    }
  })

  return (
    <div {...others} onPointerDown={onPointerDown} className={className} ref={mergedRef}>
      {children}
    </div>
  )
})

export { DragDropDiv }
