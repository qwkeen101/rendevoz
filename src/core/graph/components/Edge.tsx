import { FC, memo, MouseEventHandler, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { GraphEdge } from '../types/edge'
import { line } from 'd3-shape'
import { getMarkerId } from '../utils/getMarkerId'
import { MarkerColor } from '@/consts'
import useGraph from '../hooks/useGraph'
import { motion } from 'framer-motion'
import { select } from 'd3'
import { useMemoizedFn } from '@/hooks'
import { TypeToNodeRadius } from './node/Node'
import { NodeFakeHiddenOpacity } from '../consts/opacity'
import { oppositeEdgesMapAtom } from '../hooks/useEdges'
import { useStore } from 'jotai'
interface EdgeProps {
  edge: GraphEdge
}

const Edge: FC<EdgeProps> = memo(({ edge }) => {
  const edgeRef = useRef<SVGPathElement>(null)
  const labelRef = useRef<SVGGElement>(null)
  const graph = useGraph()

  const store = useStore()

  const [finalPosition, setFinalPosition] = useState<{
    targetx: number
    targety: number
    sourcex: number
    sourcey: number
  }>()
  const [rect, setRect] = useState({ width: 0, height: 0 })
  const [highlight, setHighlight] = useState(false)
  const [d, setD] = useState<string>()

  const textRef = useRef<SVGTextElement>(null)

  useLayoutEffect(() => {
    const isNewlyAdded = edge.id === graph?.newAddedEdge?.id
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

  useEffect(() => {
    if (textRef.current && graph) {
      const textBound = textRef.current?.getBoundingClientRect()
      textBound && setRect({ width: textBound?.width / graph.transformScale, height: textBound?.height / graph.transformScale })
    }
  }, [edge.label, finalPosition])

  const drawEdge = useMemoizedFn((): string => {
    const targetNode = graph?.nodesMap?.get(edge.targetId)
    const targetX = targetNode?.x
    const targetY = targetNode?.y
    const sourceNode = graph?.nodesMap?.get(edge.sourceId)
    const sourceX = sourceNode?.x
    const sourceY = sourceNode?.y

    const TARGET_CIRCLE_RADIUS = TypeToNodeRadius[targetNode?.type || 'normal']
    const SOURCE_CIRCLE_RADIUS = TypeToNodeRadius[sourceNode?.type || 'normal']
    const getYOffset = (type?: string) => {
      if (type === 'note') {
        return 8
      }
      return 0
    }
    const targetCircleCenterX = targetX + TARGET_CIRCLE_RADIUS
    const targetCircleCenterY = targetY + TARGET_CIRCLE_RADIUS + getYOffset(targetNode?.type)
    const sourceCircleCenterX = sourceX + SOURCE_CIRCLE_RADIUS
    const sourceCircleCenterY = sourceY + SOURCE_CIRCLE_RADIUS + getYOffset(sourceNode?.type)

    const distance = Math.sqrt(
      Math.pow(targetCircleCenterX - sourceCircleCenterX, 2) + Math.pow(targetCircleCenterY - sourceCircleCenterY, 2)
    )
    const sourceRatioOffset = sourceNode?.type === 'note' ? 30 : 10
    const targetRatioOffset = targetNode?.type === 'note' ? 30 : 10
    const sourceRatio = (SOURCE_CIRCLE_RADIUS + sourceRatioOffset) / distance
    const targetRatio = (TARGET_CIRCLE_RADIUS + targetRatioOffset) / distance
    const horizontalDistance = targetCircleCenterX - sourceCircleCenterX
    const veritcalDistance = targetCircleCenterY - sourceCircleCenterY
    const sourceDx = horizontalDistance * sourceRatio
    const sourceDy = veritcalDistance * sourceRatio
    const targetDx = horizontalDistance * targetRatio
    const targetDy = veritcalDistance * targetRatio

    const curve = line()
    // let offset = 30
    // // check out whether double direction link
    let offsetX = 0
    let offsetY = 0
    if (store.get(oppositeEdgesMapAtom).has(edge.id)) {
      // 直线的倾斜角
      const alpha = Math.atan2(targetCircleCenterY - sourceCircleCenterY, targetCircleCenterX - sourceCircleCenterX)
      offsetX = 8 * Math.sin(alpha)
      offsetY = 16 * Math.cos(alpha)
    }

    const finalSourceX = sourceCircleCenterX + sourceDx
    const finalSourceY = sourceCircleCenterY + sourceDy
    const finalTargetX = targetCircleCenterX - targetDx
    const finalTargetY = targetCircleCenterY - targetDy
    setFinalPosition({
      sourcex: finalSourceX + offsetX,
      sourcey: finalSourceY - offsetY,
      targetx: finalTargetX + offsetX,
      targety: finalTargetY - offsetY
    })
    const points = [
      [finalSourceX + offsetX, finalSourceY - offsetY],
      [finalTargetX + offsetX, finalTargetY - offsetY]
    ]
    const result = curve(points)
    setD(result)
    return result
  })

  graph?.ID_TO_EDGE_FUNCTION_MAP.set(edge.id, {
    drawEdge
  })

  const edgeMouseEnterHandler = () => {
    if (edge.opacity !== NodeFakeHiddenOpacity) setHighlight(true)
  }
  const edgeMouseLeaveHandler = () => {
    setHighlight(false)
  }
  const edgeContextMenuHandler: MouseEventHandler = e => {}
  const edgeClickHandler: MouseEventHandler = e => {
    e.stopPropagation()
    e.preventDefault()
    const manager = graph?.overlayManager
    if (manager) {
      manager.setOverlayState(s => {
        console.log(s, edge)
        return {
          visible: s.object?.id === edge.id ? !s.visible : true,
          content: 'edgeToolbar',
          position: {
            left: e.clientX,
            top: e.clientY - 10
          },
          object: edge
        }
      })
    }
  }
  return (
    <g
      onMouseEnter={edgeMouseEnterHandler}
      onMouseLeave={edgeMouseLeaveHandler}
      onContextMenu={edgeContextMenuHandler}
      onClick={edgeClickHandler}
      pointerEvents={edge.opacity === 0 ? 'none' : 'auto'}
      cursor="pointer"
    >
      <motion.path
        ref={edgeRef}
        strokeWidth={2}
        fill="transparent"
        cursor="pointer"
        initial={{ opacity: 1 }}
        animate={{
          opacity: edge.opacity,
          stroke: edge.highlight || highlight ? edge.color || MarkerColor.EMPHASIS : edge.color || MarkerColor.NORMAL
        }}
        markerEnd={`url(#${getMarkerId(
          'end',
          edge.highlight || highlight ? edge.color || MarkerColor.EMPHASIS : edge.color || MarkerColor.NORMAL
        )})`}
        d={d}
      ></motion.path>
      {edge.label && finalPosition && (
        <g
          ref={labelRef}
          transform={`translate(${(finalPosition.sourcex + finalPosition.targetx) / 2 - rect.width / 2},${
            (finalPosition.sourcey + finalPosition.targety) / 2 - rect.height / 2
          })`}
        >
          <motion.rect
            fill="white"
            width={rect.width + 5}
            height={rect.height}
            initial={{ opacity: 1 }}
            animate={{ opacity: edge.opacity }}
            x={-5}
            ry={3}
            stroke={edge.highlight || highlight ? edge.color || MarkerColor.EMPHASIS : edge.color || MarkerColor.NORMAL}
            rx={3}
            strokeWidth={2}
          ></motion.rect>
          <motion.text
            fontSize={15}
            fontWeight={600}
            fontStyle="italic"
            dy="0.1em"
            dx="-0.2em"
            fill={edge.highlight || highlight ? edge.color || MarkerColor.EMPHASIS : edge.color || MarkerColor.NORMAL}
            textAnchor="middle"
            dominantBaseline="middle"
            initial={{ opacity: 1 }}
            animate={{ opacity: edge.opacity }}
            x={rect.width / 2}
            // y={10}
            y={rect.height / 2}
            ref={textRef}
          >
            {edge.label}
          </motion.text>
        </g>
      )}
    </g>
  )
})

export default Edge
