import { IWhiteboardNode } from '~/typings'
import { useMemo, useState } from 'react'
import { NodeEvents } from '@/core/whiteboard/node/types'
import { rescalePoints } from '@/core/whiteboard/utils/points'
import { getStroke } from 'perfect-freehand'
import { getPenConfig, getSvgPathFromStroke } from '@/core/whiteboard/freehand/useFreeHand'
import { Colors } from '@/consts'
import { useDebounceEffect, useRafFn, useUpdateEffect } from '@/hooks'
import { useWhiteboardInstance } from '@/core/whiteboard/hooks/useWhiteboardInstance'

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
  const handler = (e: NodeEvents) => {
    if (e.type === 'resize') {
      const box = e.newBox
      switch (e.direction) {
        case 'x': {
          const newPoints = rescalePoints('x', box.width, innerPoints, true)
          setInnerPoints(newPoints)
          break
        }
        case 'y': {
          const newPoints = rescalePoints('y', box.height, innerPoints, true)
          setInnerPoints(newPoints)
          break
        }
        case 'both': {
          let newPoints = rescalePoints('y', box.height, innerPoints, true)
          newPoints = rescalePoints('x', box.width, newPoints, true)
          setInnerPoints(newPoints)
        }
      }
    }
  }
  const instance = useWhiteboardInstance()
  useDebounceEffect(
    () => {
      instance.updateNode?.(node.id, n => ({ ...n, points: innerPoints }), false)
    },
    [innerPoints],
    { wait: 300 }
  )
  useUpdateEffect(() => {
    if (node.width && node.height) {
      let newPoints = rescalePoints('y', node.height, innerPoints, true)
      newPoints = rescalePoints('x', node.width, newPoints, true)
      setInnerPoints(newPoints)
    }
  }, [node.x, node.y, node.width, node.height])
  const rafHandler = useRafFn(handler)
  onEventHandlerRegistered(rafHandler)
  const path = useMemo(() => {
    const config = getPenConfig(node.penType)
    const stroke = getStroke(innerPoints, { ...config, size: style?.width || 10 })
    return getSvgPathFromStroke(stroke)
  }, [innerPoints])
  const color = !style?.color || style?.color === 'default' ? Colors.Font.Primary : style.color
  return (
    <svg style={{ pointerEvents: 'none', overflow: 'visible' }}>
      <path
        fill={color}
        stroke={color}
        opacity={style?.opacity}
        d={path}
        pointerEvents={'all'}
        onClick={onClick}
      />
    </svg>
  )
}

export default FreehandNode
