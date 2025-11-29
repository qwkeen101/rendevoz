import { FC, memo, useEffect, useRef } from 'react'
import { GraphEdge } from '../types/edge'
import { Colors, MarkerColor } from '@/consts'
import useGraph from '../hooks/useGraph'
import { useMemoizedFn } from '@/hooks'
import { useStore } from 'jotai'
import { Container, Graphics, Sprite } from '@pixi/react'
import drawEdgeBetweenTwoNodes from '@/core/components/graph/utils/drawEdgeBetweenTwoNodes'
import { Graphics as _Graphics, Polygon, Container as _Container } from 'pixi.js'
import arrowSvg from '@/assets/upSvg.svg'
import { GraphNodesMapAtom } from '@/core/components/graph/hooks/useGraphNodes'
const drawLineWithOffset = (x1: number, y1: number, x2: number, y2: number, distance: number) => {
  // 计算两点之间的向量
  const vectorX = x2 - x1
  const vectorY = y2 - y1

  // 计算向量的长度
  const length = Math.sqrt(vectorX * vectorX + vectorY * vectorY)

  // 计算单位向量
  const unitX = vectorX / length
  const unitY = vectorY / length

  // 调整起点和终点，使它们离原点有指定的距离
  const startX = x1 + unitX * distance
  const startY = y1 + unitY * distance
  const endX = x2 - unitX * distance
  const endY = y2 - unitY * distance

  // 返回调整后的起点和终点
  return { startX, startY, endX, endY }
}
interface EdgeProps {
  edge: GraphEdge
}
const PixiEdge: FC<EdgeProps> = memo(({ edge }) => {
  const graph = useGraph()

  const finalPositionRef = useRef<{
    targetx: number
    targety: number
    sourcex: number
    sourcey: number
  }>()
  const containerRef = useRef<_Container>(null)
  const edgeGraphicRef = useRef<_Graphics>(null)
  const arrowHeadRef = useRef<_Graphics>(null)
  const isHidden = edge.opacity && edge.opacity < 1
  const arrowColor = edge.highlight
    ? Colors.getAdaptColor(edge.color || MarkerColor.EMPHASIS)
    : Colors.getAdaptColor(edge.color || MarkerColor.LIGHTGREY)
  const store = useStore()

  const drawLine = (w = 1) => {
    const graphics = edgeGraphicRef.current
    const finalPosition = finalPositionRef.current
    if (graphics && finalPosition) {
      const { startX, startY, endX, endY } = drawLineWithOffset(
        finalPosition.sourcex,
        finalPosition.sourcey,
        finalPosition.targetx,
        finalPosition.targety,
        graph.size + 10
      )
      graphics.clear()
      graphics.lineStyle(w, arrowColor)
      graphics.moveTo(startX, startY)
      graphics.lineTo(endX, endY)

      graphics.hitArea = new Polygon([
        startX - w * 5,
        startY - w * 5,
        startX + w * 5,
        startY + w * 5,
        endX - w * 5,
        endY - w * 5,
        endX + w * 5,
        endY + w * 5
      ])
      const arrowHead = arrowHeadRef.current
      if (arrowHead) {
        arrowHead.width = w * 15
        arrowHead.height = w * 15
        arrowHead.x = endX
        arrowHead.y = endY
      }
    }
  }
  const drawEdge = useMemoizedFn(() => {
    const nodes = store.get(GraphNodesMapAtom)
    edgeGraphicRef.current?.clear()
    const targetNode = nodes.get(edge.targetId)
    const sourceNode = nodes.get(edge.sourceId)
    if (!sourceNode || !targetNode || targetNode.x === undefined || sourceNode.x === undefined) return
    const { finalPosition: _f } = drawEdgeBetweenTwoNodes(
      {
        source: {
          x: sourceNode.x,
          y: sourceNode.y
        },
        target: {
          x: targetNode.x,
          y: targetNode.y
        }
      },
      {
        target: graph.size,
        source: graph.size
      }
    )
    finalPositionRef.current = {
      sourcex: _f.sourceX,
      targetx: _f.targetX,
      sourcey: _f.sourceY,
      targety: _f.targetY
    }
    if (arrowHeadRef.current) {
      const horizontalDis = _f.targetX - _f.sourceX
      const veriticalDis = _f.targetY - _f.sourceY
      const degree = Math.atan2(veriticalDis, horizontalDis)
      const angle = (degree * 180) / Math.PI
      const arrowHead = arrowHeadRef.current
      arrowHead.angle = 90 + angle
    }
    drawLine()
  })
  graph?.ID_TO_EDGE_FUNCTION_MAP.set(edge.id, {
    drawEdge,
    hideLabel: () => {
    },
    unhidenLabel: () => {
    }
  })
  useEffect(() => {
    drawLine()
  }, [edge.label, arrowColor])
  return (
    <Container ref={containerRef} zIndex={isHidden ? 0 : 10}>
      <Graphics ref={edgeGraphicRef} alpha={edge.opacity ?? 1} />
      <Sprite anchor={0.5} image={arrowSvg} ref={arrowHeadRef} tint={arrowColor} alpha={edge.opacity ?? 1} />
    </Container>
  )
})

export default PixiEdge
