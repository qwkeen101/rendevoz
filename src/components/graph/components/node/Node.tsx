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
import { documentsAtom } from '@/stores/document.store'
import { INote, IPdfDocument } from '~/typings/data'
import { globalStore } from '@/stores/stores'
import useTags from '../../hooks/useTags'
import { Tag } from '@/components/form/EditMetaObjectForm'
import { Content } from '@/components/base'

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
  const [tags] = useTags()

  const thisNodeShowTags = useMemo(() => {
    const nodeTags = node.tags || []
    const showTags = nodeTags?.filter(i => tags.some(o => o === i))
    return showTags
  }, [tags])
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
  const radius = TypeToNodeRadius[node.type || 'normal']
  const d = useMemo(() => radius * 2, [radius])
  const originNode = useMemo(() => graph?.nodesMap?.get(node.id), [node.id])
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
              <Tag tag={i} small hideDelete hideSize key={i}/>
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
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
      cursor="pointer"
      pointerEvents="auto"
      ref={nodeRef}
      initial={{ opacity: node.opacity || 1 }}
      animate={{ opacity: node.opacity }}
      transform={`translate(${node?.x},${node?.y})`}
    >
      {renderNode()}
      {renderTags()}
    </motion.g>
  )
})

export default Node
