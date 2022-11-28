import { FC, memo, MouseEventHandler, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { GraphEdge } from '../types/edge'
import { line, curveBasis } from 'd3-shape'
import { getIntersectedPointsOfLineAndCircle } from '../utils/getIntersectPoints'
import { getMarkerId } from '../utils/getMarkerId'
import { MarkerColor } from '../consts/markerColors'
import useGraph from '../hooks/useGraph'
import { motion } from 'framer-motion'
import { select } from 'd3'
import { name } from 'react-lorem-ipsum'
import useEventEmitter from '@/events/useEventEmitter'
interface EdgeProps {
  edge: GraphEdge
}

const CIRCLE_RADIUS = 20

const Edge: FC<EdgeProps> = memo(({ edge }) => {
  const sourceX = edge.source?.x || 0
  const sourceY = edge.source?.y || 0
  const targetX = edge.target?.x || 0
  const targetY = edge.target?.y || 0
  const edgeRef = useRef<SVGPathElement>(null)
  const labelRef = useRef<SVGGElement>(null)
  const graph = useGraph()
  const originEdges = graph?.originEdges
  const [highlight, setHighlight] = useState(false)
  const [n] = useState(name())
  const emitter = useEventEmitter()

  useLayoutEffect(() => {
    if (edgeRef.current) {
      graph?.registerEdgeElement(edge.id, edgeRef.current)
      if (edge.id === graph?.newAddedEdge?.id) {
        const path = select(edgeRef.current)
        const length = path.node()?.getTotalLength()
        path
          .attr('stroke-dasharray', length + ' ' + length)
          .attr('stroke-dashoffset', length)
          .transition()
          .duration(500)
          .attr('stroke-dashoffset', 0)
          .on('end', () => {
            path.attr('stroke-dasharray', null)
          })
        const text = select(labelRef.current).selectChild('text')
        text.attr('opacity', 0).transition().duration(500).attr('opacity', 1)
        graph.registerNewAddedEdge(null)
      }
    }
    if (labelRef.current) {
      graph?.registerLabelElement(edge.id, labelRef.current)
    }
  }, [edge])
  const oppositeEdge = originEdges?.find(i => i.source?.id === edge.targetId && i.target?.id === edge.sourceId)
  let offsetLabelRatio = 1
  if (oppositeEdge) {
    if (oppositeEdge.source?.id > edge.sourceId) {
      offsetLabelRatio = -1.5
    } else {
      offsetLabelRatio = 2.5
    }
  }
  const drawEdge = (): string => {
    const targetCircleCenterX = targetX + CIRCLE_RADIUS
    const targetCircleCenterY = targetY + CIRCLE_RADIUS
    const sourceCircleCenterX = sourceX + CIRCLE_RADIUS
    const sourceCircleCenterY = sourceY + CIRCLE_RADIUS
    const intersectedPoints = getIntersectedPointsOfLineAndCircle(
      { x: sourceCircleCenterX, y: sourceCircleCenterY },
      { x: targetCircleCenterX, y: targetCircleCenterY },
      { x: targetCircleCenterX, y: targetCircleCenterY },
      CIRCLE_RADIUS
    )
    intersectedPoints.sort((a, b) => {
      const dxA = Math.abs(a.x - sourceX)
      const dyA = Math.abs(a.y - sourceY)
      const dxB = Math.abs(b.x - sourceX)
      const dyB = Math.abs(b.y - sourceY)
      const distanceA = Math.sqrt(Math.pow(dxA, 2) + Math.pow(dyA, 2))
      const distanceB = Math.sqrt(Math.pow(dxB, 2) + Math.pow(dyB, 2))
      return distanceA - distanceB
    })
    const finalTargetX = intersectedPoints[0]?.x || targetCircleCenterX
    const finalTargetY = intersectedPoints[0]?.y || targetCircleCenterY
    const curve = line().curve(curveBasis)
    let offset = 30
    // check out whether double direction link
    if (originEdges) {
      const oppositeEdge = originEdges.find(i => i.source?.id === edge.targetId && i.target?.id === edge.sourceId)
      if (oppositeEdge && oppositeEdge.source?.id > edge.sourceId) offset = -30
    }
    const points = [
      [sourceCircleCenterX, sourceCircleCenterY],
      [(sourceCircleCenterX + finalTargetX) / 2, (sourceCircleCenterY + finalTargetY) / 2 + offset],
      [finalTargetX, finalTargetY]
    ]
    return curve(points)
  }

  const d = drawEdge()
  const [centerX, centerY] = [(sourceX + targetX) / 2, (sourceY + targetY) / 2]
  const edgeMouseEnterHandler = () => {
    setHighlight(true)
  }
  const edgeMouseLeaveHandler = () => {
    setHighlight(false)
  }
  const edgeContextMenuHandler: MouseEventHandler = e => {
    emitter.emit('graph', {
      type: 'toggleContextMenu',
      data: {
        componentType: 'edge',
        clientX: e.clientX,
        clientY: e.clientY
      }
    })
  }
  return (
    <g
      onMouseEnter={edgeMouseEnterHandler}
      onMouseLeave={edgeMouseLeaveHandler}
      onContextMenu={edgeContextMenuHandler}
      pointerEvents="auto"
      cursor="pointer"
    >
      <motion.path
        ref={edgeRef}
        strokeWidth={2}
        fill="transparent"
        cursor="pointer"
        initial={{ opacity: 1 }}
        animate={{ opacity: edge.opacity, stroke: edge.highlight || highlight ? MarkerColor.EMPHASIS : MarkerColor.NORMAL }}
        markerEnd={`url(#${getMarkerId('end', edge.highlight || highlight ? MarkerColor.EMPHASIS : MarkerColor.NORMAL)})`}
        d={d}
      ></motion.path>
      <g ref={labelRef} transform={`translate(${centerX + 5 * offsetLabelRatio},${centerY + 20 * offsetLabelRatio})`}>
        <motion.rect
          fill="white"
          width={40}
          height={20}
          initial={{ opacity: 1 }}
          animate={{ opacity: edge.opacity }}
          rx={2}
          ry={2}
        ></motion.rect>
        <motion.text
          fontSize={15}
          fontWeight={600}
          fontStyle="italic"
          dy="0.1em"
          dx="-0.2em"
          fill={edge.highlight || highlight ? MarkerColor.EMPHASIS : MarkerColor.NORMAL}
          textAnchor="middle"
          dominantBaseline="middle"
          initial={{ opacity: 1 }}
          animate={{ opacity: edge.opacity }}
          x={20}
          y={10}
        >
          {n}
        </motion.text>
      </g>
    </g>
  )
})

export default Edge
