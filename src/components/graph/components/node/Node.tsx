import { FC, memo, MouseEventHandler, useEffect, useRef, MouseEvent } from 'react'
import { GraphNode } from '../../types/node'
import ImageNode from './ImageNode'
import { select } from 'd3-selection'
import { drag as d3Drag } from 'd3-drag'
import D3GraphManager from '../../D3GraphManager'
import useGraph from '../../hooks/useGraph'
import { motion } from 'framer-motion'
import { NodeMouseEventHandler } from '../NodeContainer'
import IconNode from './IconNode'

interface NodeProps {
  node: GraphNode
  onMouseEnter?: NodeMouseEventHandler
  onMouseLeave?: NodeMouseEventHandler
  onClick?: NodeMouseEventHandler
  onContextMenu?: NodeMouseEventHandler
  onMouseDown?: NodeMouseEventHandler
}
const Node: FC<NodeProps> = memo(({ node, onMouseEnter, onMouseLeave, onContextMenu, onClick }) => {
  const nodeRef = useRef<SVGGElement>(null)
  const graph = useGraph()
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
    console.log(node)
    onClick?.(e, node)
  }
  function drag() {
    const simulation = graph?.d3Simulation
    const n = graph?.originNodes?.find(i => i.id === node.id)
    function dragstarted(event) {
      if (graph?.isAddingEdge) return
      if (!event.active) simulation?.alphaTarget(0.1).restart()
      event.subject.fx = n.x
      event.subject.fy = n.y
    }

    function dragged(event) {
      if (graph?.isAddingEdge) return
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
    }
    return d3Drag().subject(n).on('start', dragstarted).on('drag', dragged).on('end', dragended)
  }
  return (
    <motion.g
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
      cursor="pointer"
      pointerEvents="auto"
      ref={nodeRef}
      initial={{ opacity: node.opacity || 1 }}
      animate={{ opacity: node.opacity }}
      transform={`translate(${node.x},${node.y})`}
    >
      <IconNode node={node} />
      {/* <ImageNode node={node} /> */}
    </motion.g>
  )
})

export default Node
