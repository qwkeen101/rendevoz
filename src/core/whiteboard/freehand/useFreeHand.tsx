import React, { useMemo, useState, useRef } from 'react'
import { useFlow } from '@/core/whiteboard/hooks'
import { getStroke } from 'perfect-freehand'
import { getBoxOfPoints } from '@/core/whiteboard/utils'
import { useRafFn, useSelectAtomValue } from '@/hooks'
import { useWhiteboardState, WhiteboardStateAtom } from '@/core/whiteboard/hooks/useWhiteboardState'
import { Colors } from '@/consts'
import { IWhiteboardNode, IPenStyle } from '~/typings'
import { useWhiteboardInstance } from '@/core/whiteboard/hooks/useWhiteboardInstance'

// [x, y, pressure]
type Points = [number, number, number][]
export const BallpenConfig = {
  size: 8,
  smoothing: 0.5,
  thinning: 0.6,
  streamline: 0.5,
  easing: t => Math.sin((t * Math.PI) / 2),
  start: {
    taper: 0,
    cap: true
  },
  end: {
    taper: 0,
    cap: true
  }
}
export const PenConfig = {
  size: 15,
  smoothing: 0.42,
  thinning: 0.68,
  streamline: 0.16,
  easing: t => t,
  start: {
    taper: 53,
    cap: true
  },
  end: {
    taper: 58,
    cap: true
  }
}
export const MarkerpenConfig = {
  size: 15,
  smoothing: 0.01,
  thinning: 0.11,
  streamline: 0.32,
  easing: t => t,
  start: {
    taper: 0,
    cap: false
  },
  end: {
    taper: 0,
    cap: false
  }
}

const average = (a, b) => (a + b) / 2

export function getSvgPathFromStroke(points, closed = true) {
  const len = points.length

  if (len < 4) {
    return ``
  }

  let a = points[0]
  let b = points[1]
  const c = points[2]

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(
    b[1],
    c[1]
  ).toFixed(2)} T`

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i]
    b = points[i + 1]
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `
  }

  if (closed) {
    result += 'Z'
  }

  return result
}

const useFreeHand = () => {
  const [points, setPoints] = useState<Points>()
  const flow = useFlow()
  const currentTool = useSelectAtomValue(WhiteboardStateAtom, s => s.currentTool)
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  const isPressed = useRef(false)
  const handlePointerDown: React.PointerEventHandler<SVGSVGElement> = e => {
    if (whiteboardState.isPanning) return
    if (e.button === 0) {
      e.preventDefault()
      e.stopPropagation()
      isPressed.current = true
    }
    ;(e.target as SVGSVGElement).setPointerCapture(e.pointerId)
    const transformedXY = flow.transformPointer(e)
    if (transformedXY) {
      setPoints([[Number(transformedXY.x.toFixed(4)), Number(transformedXY.y.toFixed(4)), e.pressure]])
      setWhiteboardState(s => ({ ...s, freeDrawing: true }))
    }
  }

  const handlePointerMove: React.PointerEventHandler<SVGSVGElement> = e => {
    if (!isPressed.current || whiteboardState.isPanning) return
    const transformedXY = flow.transformPointer(e)
    if (transformedXY && points) {
      e.preventDefault()
      e.stopPropagation()
      points.push([Number(transformedXY.x.toFixed(4)), Number(transformedXY.y.toFixed(4)), e.pressure])
      setPoints([...points])
    }
  }
  const rafPointerMove = useRafFn(handlePointerMove)
  const instance = useWhiteboardInstance()
  const handlePointerUp = (e: PointerEvent) => {
    isPressed.current = false
    setWhiteboardState(s => ({ ...s, freeDrawing: false }))
    if (points) {
      const bounds = getBoxOfPoints(points)
      const newPoints = points.map(p => [p[0] - bounds.left, p[1] - bounds.top, p[2]])
      instance.insertNode?.({
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height,
        points: newPoints,
        type: 'freehand',
        penType: whiteboardState.freeHandConfig.type || 'ballpen',
        style: whiteboardState.freeHandConfig.style
      })
    }
    setPoints(undefined)
  }
  const renderDrawLayer = () => {
    if (currentTool !== 'freehand') return null
    return (
      <svg
        onWheelCapture={e => {
          if (whiteboardState.freeDrawing) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        role={'data-container'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={rafPointerMove}
        onPointerUp={handlePointerUp}
      ></svg>
    )
  }
  const renderFreehands = () => {
    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
          zIndex: 999
        }}
      >
        {points && <Path points={points} style={whiteboardState.freeHandConfig.style} type={whiteboardState.freeHandConfig.type} />}
      </svg>
    )
  }
  return {
    renderDrawLayer,
    renderFreehands
  }
}
export const getPenConfig = (type?: (IWhiteboardNode & { type: 'freehand' })['penType']) => {
  switch (type) {
    case 'marker':
      return MarkerpenConfig
    case 'pen':
      return PenConfig
    case 'ballpen':
      return BallpenConfig
    default:
      return BallpenConfig
  }
}
const Path = ({
  points,
  type,
  style
}: {
  points: Points
  type: (IWhiteboardNode & { type: 'freehand' })['penType']
  style?: IPenStyle
}) => {
  const color = !style?.color || style?.color === 'default' ? Colors.Font.Primary : style.color
  const path = useMemo(() => {
    const config = getPenConfig(type)
    const stroke = getStroke(points, { ...config, size: style?.width || 10 })
    return getSvgPathFromStroke(stroke)
  }, [points])
  return <path fill={color} stroke={color} d={path} opacity={style?.opacity} />
}
export default useFreeHand
