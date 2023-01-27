import { FC, memo, MouseEventHandler, useEffect, useRef, MouseEvent, useMemo } from 'react'
import { GraphNode } from '../../types/node'
import ImageNode from './ImageNode'
import { select } from 'd3-selection'
import { drag as d3Drag } from 'd3-drag'
import useGraph from '../../hooks/useGraph'
import { motion } from 'framer-motion'
import { NodeMouseEventHandler } from '../NodeContainer'
import IconNode from './IconNode'
import { notesAtom } from '@/stores/note.store'
import { atom } from 'jotai/vanilla'
import { useAtomValue } from 'jotai/react'
import { GlobalScope } from '@/jotai/jotaiScope'
import { documentsAtom } from '@/stores/document.store'
import { INote, IPdfDocument } from '~/typings/data'
import { globalStore } from '@/stores/stores'

interface NodeProps {
  node: GraphNode
  onMouseEnter?: NodeMouseEventHandler
  onMouseLeave?: NodeMouseEventHandler
  onClick?: NodeMouseEventHandler
  onContextMenu?: NodeMouseEventHandler
  onMouseDown?: NodeMouseEventHandler
}

export const TypeToNodeRadius = {
  pdf: 60,
  pdfElement: 20,
  note: 40,
  normal: 20
}
const Node: FC<NodeProps> = memo(({ node, onMouseEnter, onMouseLeave, onContextMenu, onClick }) => {
  const nodeRef = useRef<SVGGElement>(null)
  const graph = useGraph()
  const { type, objectId } = node
  const nodeObjectAtom = useMemo(() => {
    if (objectId) {
      if (type === 'note') {
        return atom(get => get(notesAtom).get(objectId))
      }
      if (type === 'pdf') {
        return atom(get => get(documentsAtom).get(objectId))
      }
    }
    return atom(null)
  }, [node.objectId])
  const object = useAtomValue(nodeObjectAtom, { store: globalStore })
  const renderNode = () => {
    if (node.type === 'note') {
      return <IconNode node={node} label={(object as INote)?.title} />
    }
    if (node.type === 'pdfElement') {
      return <IconNode node={node} />
    }
    if (node.type === 'pdf') {
      return <ImageNode label={(object as IPdfDocument)?.name} imageUrl={(object as IPdfDocument)?.metadata?.coverUrl} node={node} />
    }
    return <ImageNode node={node} />
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
      {renderNode()}
    </motion.g>
  )
})

export default Node
