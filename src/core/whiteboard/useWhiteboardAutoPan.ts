import { useMousePositionRef, useRafFn } from '@/hooks'
import { Position, Rect } from '@/types'
import { useEffect, useRef } from 'react'
import { useFlow } from './hooks'

type XYPosition = Required<Pick<Position, 'x' | 'y'>>

type CoordinateExtent = [[number, number], [number, number]]

export const clamp = (val: number, min = 0, max = 1): number => Math.min(Math.max(val, min), max)

export const clampPosition = (position: XYPosition = { x: 0, y: 0 }, extent: CoordinateExtent) => ({
  x: clamp(position.x, extent[0][0], extent[1][0]),
  y: clamp(position.y, extent[0][1], extent[1][1])
})

// returns a number between 0 and 1 that represents the velocity of the movement
// when the mouse is close to the edge of the canvas
const calcAutoPanVelocity = (value: number, min: number, max: number): number => {
  if (value < min) {
    return clamp(Math.abs(value - min), 1, 50) / 50
  } else if (value > max) {
    return -clamp(Math.abs(value - max), 1, 50) / 50
  }

  return 0
}

export const calcAutoPan = (pos: XYPosition, bounds: Rect): number[] => {
  const xMovement = calcAutoPanVelocity(pos.x, 35, bounds.width - 35) * 20
  const yMovement = calcAutoPanVelocity(pos.y, 35, bounds.height - 35) * 20

  return [xMovement, yMovement]
}

const useWhiteboardAutoPan = () => {
  const flow = useFlow()
  const autoPanId = useRef<number>()
  const mousePosRef = useMousePositionRef()
  const autoPan = () => {
    const container = flow.containerEle
    if (!container || (!flow.isSelecting && !flow.isAddingEdge && !flow.isDraggingNode)) {
      autoPanId.current = undefined
      return
    }
    const parent = container.parentElement
    const parentBound = (parent as HTMLElement).getBoundingClientRect()
    const [xMovement, yMovement] = calcAutoPan(
      {
        x: mousePosRef.current[0] - parentBound.x,
        y: mousePosRef.current[1] - parentBound.y
      },
      parentBound
    )
    if (xMovement !== 0 || yMovement !== 0) {
      flow.panzoom?.moveBy(xMovement, yMovement, false)
    }
    autoPanId.current = requestAnimationFrame(autoPan)
  }
  const pointerMoveHandler = (e: PointerEvent) => {
    if (flow.isSelecting || flow.isDraggingNode || flow.isAddingEdge) {
      if (!autoPanId.current) {
        autoPan()
      }
    }
  }
  const rafPointerMoveHandler = useRafFn(pointerMoveHandler)
  useEffect(() => {
    flow.containerEle?.parentElement?.addEventListener('pointermove', rafPointerMoveHandler)
    return () => {
      flow.containerEle?.parentElement?.removeEventListener('pointermove', rafPointerMoveHandler)
    }
  })
}

export default useWhiteboardAutoPan
