import { FreehandPoint, IWhiteboardNode } from '~/typings'
import { useEffect, useMemo, useState } from 'react'
import { NodeEvents } from '@/core/components/whiteboard/node/types'
import { rescalePoints } from '@/core/components/whiteboard/utils/points'
import { getStroke } from 'perfect-freehand'
import { getPenConfig, getSvgPathFromStroke } from '@/core/components/whiteboard/freehand/useFreeHand'
import { Colors } from '@/consts'
import { useDebounceEffect, useRafFn, useUpdateEffect } from '@/hooks'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'

const FreehandNode = ({
  node,
  onEventHandlerRegistered,
  onClick
}: {
  node: IWhiteboardNode & { type: 'freehand' }
  onEventHandlerRegistered: (handler: (e: NodeEvents) => void) => void
  onClick: (e: MouseEvent) => void
}) => {
  const style = node.style
  const [innerPoints, setInnerPoints] = useState(node.points)
  const isArrayPoints = (points: FreehandPoint[] | FreehandPoint[][]): points is FreehandPoint[][] => {
    return Array.isArray(points[0][0])
  }
  const handler = (e: NodeEvents) => {
    if (e.type === 'resize') {
      const box = e.newBox
      switch (e.direction) {
        case 'x': {
          if (isArrayPoints(innerPoints)) {
            const newPoints = innerPoints.map(o => rescalePoints('x', box.width, o, true))
            setInnerPoints(newPoints)
          } else {
            const newPoints = rescalePoints('x', box.width, innerPoints, true)
            setInnerPoints(newPoints)
          }

          break
        }
        case 'y': {
          if (isArrayPoints(innerPoints)) {
            const newPoints = innerPoints.map(o => rescalePoints('y', box.height, o, true))
            setInnerPoints(newPoints)
          } else {
            const newPoints = rescalePoints('y', box.height, innerPoints, true)
            setInnerPoints(newPoints)
          }
          break
        }
        case 'both': {
          if (isArrayPoints(innerPoints)) {
            let newPoints = innerPoints.map(o => rescalePoints('y', box.height, o, true))
            newPoints = innerPoints.map(o => rescalePoints('x', box.width, o, true))
            setInnerPoints(newPoints)
          } else {
            let newPoints = rescalePoints('y', box.height, innerPoints, true)
            newPoints = rescalePoints('x', box.width, newPoints, true)
            setInnerPoints(newPoints)
          }
        }
      }
    }
  }
  const instance = useWhiteboardInstance()
  // useEffect(() => {
  //   if (node.points !== innerPoints) {
  //     setInnerPoints(node.points)
  //   }
  // }, [node.points])
  useDebounceEffect(
    () => {
      if (innerPoints !== node.points) {
        instance.updateNode?.(node.id, n => ({ ...n, points: innerPoints }), false)
      }
    },
    [innerPoints],
    { wait: 300 }
  )
  useUpdateEffect(() => {
    if (node.width && node.height) {
      if (isArrayPoints(node.points)) {
        let newPoints = node.points.map(p => rescalePoints('y', node.height, p, true))
        newPoints = newPoints.map(p => rescalePoints('x', node.width, p, true))
        setInnerPoints(newPoints)
        console.log(node.points, newPoints)
      } else {
        let newPoints = rescalePoints('y', node.height, node.points, true)
        newPoints = rescalePoints('x', node.width, newPoints, true)
        setInnerPoints(newPoints)
      }
    }
  }, [node.x, node.y, node.width, node.height])
  const rafHandler = useRafFn(handler)
  onEventHandlerRegistered(rafHandler)
  const path = useMemo(() => {
    if (isArrayPoints(innerPoints)) {
      const config = getPenConfig(node.penType)
      return innerPoints.map(p => {
        const stroke = getStroke(p, { ...config, size: style?.width || 10 })
        return getSvgPathFromStroke(stroke)
      })
    } else {
      const config = getPenConfig(node.penType)
      const stroke = getStroke(innerPoints, { ...config, size: style?.width || 10 })
      return getSvgPathFromStroke(stroke)
    }
  }, [innerPoints])
  const color = !style?.color || style?.color === 'default' ? Colors.Font.Primary : style.color
  return (
    <svg style={{ pointerEvents: 'none', overflow: 'visible' }}>
      {Array.isArray(path) ? (
        path.map(p => <path fill={color} stroke={color} opacity={style?.opacity} d={p} pointerEvents={'all'} onClick={onClick} />)
      ) : (
        <path fill={color} stroke={color} opacity={style?.opacity} d={path} pointerEvents={'all'} onClick={onClick} />
      )}
    </svg>
  )
}

export default FreehandNode
