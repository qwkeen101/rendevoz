import { FC, memo, MouseEventHandler, useEffect, useRef, useMemo } from 'react'
import { GraphNode } from '../../types/node'
import ImageNode from './ImageNode'
import { select } from 'd3-selection'
import { drag as d3Drag } from 'd3-drag'
import useGraph from '../../hooks/useGraph'
import { motion } from 'framer-motion'
import { NodeMouseEventHandler } from '../NodeContainer'
import IconNode from './IconNode'
import useTags from '../../hooks/useTags'
import { Tag } from '@/components/form/EditMetaObjectForm'
import { Content } from '@/components/base'
import { MetaObject } from '~/typings/data'
import { useToggle } from '@/hooks'
import { MarkerColor } from '@/components/svg/markerColors'
import { useAtomValue } from 'jotai'
import { FilterSelectedTagsAtom } from '@/components/database/filter/useObjectFilter'

interface NodeProps {
  node: GraphNode
  onMouseEnter?: NodeMouseEventHandler
  onMouseLeave?: NodeMouseEventHandler
  onClick?: NodeMouseEventHandler
  onContextMenu?: NodeMouseEventHandler
  onMouseDown?: NodeMouseEventHandler
}

export const TypeToNodeRadius: Record<MetaObject['type'], number> = {
  pdf: 60,
  pdfElement: 20,
  note: 40,
  normal: 20,
  noteElement: 20,
  image: 40,
  whiteboard: 40
}
const Node: FC<NodeProps> = memo(({ node, onMouseEnter, onMouseLeave, onContextMenu, onClick }) => {
  const nodeRef = useRef<SVGGElement>(null)
  const graph = useGraph()
  const filterTags = useAtomValue(FilterSelectedTagsAtom)

  const thisNodeShowTags = useMemo(() => {
    if (node.opacity !== 1) {
      return []
    }
    const nodeTags = node.tags || []
    const allSelectedTags = new Set<string>(
      Array.from(filterTags.values())
        .map(i => [...i])
        .flat(1)
    )

    const showTags = nodeTags?.filter(i => allSelectedTags.has(i))
    return showTags
  }, [filterTags, node.opacity])

  const radius = TypeToNodeRadius[node.type || 'normal']
  const d = radius * 2
  const originNode = graph?.nodesMap?.get(node.id)
  const renderNode = () => {
    if (node.coverImgSrc) {
      return <ImageNode node={node} />
    }
    switch (node.type) {
      case 'note':
      case 'whiteboard':
      case 'pdfElement':
      case 'noteElement':
        return <IconNode node={node} />
      case 'pdf':
      case 'image':
        return <ImageNode node={node} />
      default:
        return <IconNode node={node} />
    }
  }
  useEffect(() => {
    if (nodeRef.current) {
      graph?.registerNodeElement(node.id, nodeRef.current)
      const selection = select(nodeRef.current).call(drag())
      return () => {
        selection.on('.drag', null)
      }
    }
  }, [node, graph])

  const handleMouseEnter: MouseEventHandler = e => {
    onMouseEnter?.(e, node)
  }
  const handleMouseLeave: MouseEventHandler = e => {
    onMouseLeave?.(e, node)
  }
  const handleContextMenu: MouseEventHandler = e => {
    onContextMenu?.(e, node)
  }
  const handleClick: MouseEventHandler = e => {
    onClick?.(e, node)
  }
  function drag() {
    const simulation = graph?.d3Simulation
    const n = originNode
    let restarted = false
    function dragstarted(event) {
      if (graph?.isAddingEdge) return
      if (!event.active) simulation?.alphaTarget(0.1)
      event.subject.fx = n.x
      event.subject.fy = n.y
    }

    function dragged(event) {
      if (graph?.isAddingEdge) return
      if (!restarted) {
        restarted = true
        simulation?.restart()
        console.log('restart')
      }
      graph.isDragging = true
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event) {
      if (graph?.isAddingEdge) return
      graph.isDragging = false
      if (!event.active) simulation?.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
      restarted = false
    }
    return d3Drag().subject(n).on('start', dragstarted).on('drag', dragged).on('end', dragended)
  }

  const renderTags = () => {
    if (thisNodeShowTags.length > 0) {
      return (
        <foreignObject x={d + 5} overflow="visible">
          <Content flex column gap={3}>
            {thisNodeShowTags.map(i => (
              <Tag tag={i} small hideDelete hideSize key={i} />
            ))}
          </Content>
        </foreignObject>
      )
    }
    return null
  }
  return (
    <motion.g
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      cursor="pointer"
      pointerEvents="auto"
      ref={nodeRef}
      initial={{ opacity: node.opacity || 1 }}
      animate={{ opacity: node.opacity }}
      transform={node.x && node.y ? `translate(${node?.x},${node?.y})` : undefined}
    >
      {renderNode()}
      {renderTags()}
      {node.isCenter && (
        <motion.circle
          style={{ transformOrigin: `${radius}px ${radius}px` }}
          fill="none"
          stroke={MarkerColor.EMPHASIS}
          pointerEvents="none"
          strokeWidth="2"
          initial={{ scale: node.scale || 1, opacity: 0, r: radius + 10 }}
          animate={{ scale: node.scale, opacity: 0.8, r: radius + 20 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            repeatType: 'reverse'
          }}
          cx={radius}
          cy={radius}
        ></motion.circle>
      )}
    </motion.g>
  )
})

export default Node
