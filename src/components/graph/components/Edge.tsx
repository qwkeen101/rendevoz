import { FC, memo, MouseEventHandler, useLayoutEffect, useRef, useState } from 'react'
import { GraphEdge } from '../types/edge'
import { line, curveBasis } from 'd3-shape'
import { getMarkerId } from '../utils/getMarkerId'
import { MarkerColor } from '../consts/markerColors'
import useGraph from '../hooks/useGraph'
import { motion } from 'framer-motion'
import { select } from 'd3'
import useEventEmitter from '@/events/useEventEmitter'
import { usePrevious } from '@/hooks'
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
  const oppositeEdge = graph?.oppositeEdgesMap.get(edge.id)

  const [highlight, setHighlight] = useState(false)
  const [d, setD] = useState<string>()
  const previousEdge = usePrevious(edge)
  const emitter = useEventEmitter()

  useLayoutEffect(() => {
    const isNewlyAdded = edge.id === graph?.newAddedEdge?.id
    if (
      !(
        edge.source?.x === previousEdge?.source?.x &&
        edge.source?.y === previousEdge?.source?.y &&
        edge.target?.x === previousEdge?.target?.x &&
        edge.target?.y === previousEdge?.target?.y
      )
    ) {
      setD(drawEdge())
    }
    if (edgeRef.current) {
      graph?.registerEdgeElement(edge.id, edgeRef.current)
      if (isNewlyAdded) {
        setTimeout(() => {
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
        }, 0)
      }
    }
    if (labelRef.current) {
      graph?.registerLabelElement(edge.id, labelRef.current)
    }
  }, [edge])

  let offsetLabelRatio = 1
  if (oppositeEdge) {
    if (oppositeEdge.source?.id > edge.sourceId) {
      offsetLabelRatio = -1.5
    } else {
      offsetLabelRatio = 2.5
    }
  }
  const drawEdge = (): string => {
    const CIRCLE_RADIUS = 20
    const targetCircleCenterX = targetX + CIRCLE_RADIUS
    const targetCircleCenterY = targetY + CIRCLE_RADIUS
    const sourceCircleCenterX = sourceX + CIRCLE_RADIUS
    const sourceCircleCenterY = sourceY + CIRCLE_RADIUS
    const distance = Math.sqrt(
      Math.pow(targetCircleCenterX - sourceCircleCenterX, 2) + Math.pow(targetCircleCenterY - sourceCircleCenterY, 2)
    )
    const ratio = (CIRCLE_RADIUS + 10) / distance
    const dx = (targetCircleCenterX - sourceCircleCenterX) * ratio
    const dy = (targetCircleCenterY - sourceCircleCenterY) * ratio
    const curve = line().curve(curveBasis)
    let offset = 30
    // check out whether double direction link
    if (originEdges) {
      if (oppositeEdge && oppositeEdge.source?.id > edge.sourceId) offset = -30
    }
    const finalSourceX = sourceCircleCenterX + dx
    const finalSourceY = sourceCircleCenterY + dy
    const finalTargetX = targetCircleCenterX - dx
    const finalTargetY = targetCircleCenterY - dy

    const points = [
      [finalSourceX, finalSourceY],
      [(finalSourceX + finalTargetX) / 2, (finalSourceY + finalTargetY) / 2 + offset],
      [finalTargetX, finalTargetY]
    ]
    return curve(points)
  }

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
  const edgeClickHandler: MouseEventHandler = e => {
    const edgeBounding = edgeRef.current!.getBoundingClientRect()
    emitter.emit('graph', {
      type: 'toggleEdgeAttributeCard',
      data: {
        edge,
        clientX: edgeBounding.x + edgeBounding.width / 2,
        clientY: edgeBounding.y + edgeBounding.height / 2 + 20
      }
    })
  }
  return (
    <g
      onMouseEnter={edgeMouseEnterHandler}
      onMouseLeave={edgeMouseLeaveHandler}
      onContextMenu={edgeContextMenuHandler}
      onClick={edgeClickHandler}
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
      {edge.label && (
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
            {edge.label}
          </motion.text>
        </g>
      )}
    </g>
  )
})

export default Edge
