import { RefObject, useEffect, useRef, useState } from 'react'
import { XYPosition } from '~/typings'
import { Rect } from '@/types'
import { useMousePositionRef } from '@/hooks'
import useEventListener from '@/hooks/utils/useEventListener'

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

// simulate scroll the container when select text
// only supports vertical scroll, including virtual list
const useDragScroll = (
  containerRef: RefObject<HTMLElement>,
  cbs: {
    onScroll: (ymovement: number) => void
  }
) => {
  const autoPanId = useRef<number>()
  const mousePosRef = useMousePositionRef()
  const [enable, setEnable] = useState(false)
  const enableref = useRef(false)
  enableref.current = enable
  const autoPan = () => {
    if (!enableref.current) return
    const container = containerRef.current
    if (!container) {
      return
    }
    const parentBound = container.getBoundingClientRect()
    const [xMovement, yMovement] = calcAutoPan(
      {
        x: mousePosRef.current[0] - parentBound.x,
        y: mousePosRef.current[1] - parentBound.y
      },
      parentBound
    )
    if (yMovement !== 0) {
      cbs.onScroll?.(yMovement)
    }
    autoPanId.current = requestAnimationFrame(autoPan)
  }
  const pointermoveHandler = (e: PointerEvent) => {
    if (!autoPanId.current) {
      autoPan()
    }
  }
  useEffect(() => {
    const container = containerRef.current
    if (container && enable) {
      container.addEventListener('pointermove', pointermoveHandler)
      return () => {
        container.removeEventListener('pointermove', pointermoveHandler)
      }
    }
  })
  return {
    startScroll: () => setEnable(true),
    endScroll: () => {
      console.log('end scroll')
      setEnable(false)
    }
  }
}

export default useDragScroll
