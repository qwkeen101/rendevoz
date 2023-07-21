import { FC, memo, MouseEventHandler, useEffect, useMemo, useRef } from 'react'
import { GraphNode } from '../../types/node'
import ImageNode from './ImageNode'
import { select } from 'd3-selection'
import { drag as d3Drag } from 'd3-drag'
import useGraph from '../../hooks/useGraph'
import { NodeMouseEventHandler } from '../NodeContainer'
import IconNode from './IconNode'
import { FilterSelectedTagsAtom, ObjectTag } from '@/core'
import { Content } from '@/components/base'
import { MetaObject } from '~/typings/data'
import { useAtomValue, useSetAtom } from 'jotai'
import EmojiNode from './EmojiNode'
import { MetaStore } from '@/stores'
import { GraphPathFilterAtom } from '../GraphPathFilter'
import { GraphPinNodesIdsAtom } from '../../hooks/useGraphFilter'
import SvgIconRenderer from '../icons/SvgIconRenderer'
import { GraphModeAtom } from '../../hooks/useGraphMode'
import Colors from '@/consts/colors'
import { TypeToRegisteredMetaObject } from '@/stores/meta.store'

export interface NodeProps {
  node: GraphNode
  onMouseEnter?: NodeMouseEventHandler
  onMouseLeave?: NodeMouseEventHandler
  onClick?: NodeMouseEventHandler
  onContextMenu?: NodeMouseEventHandler
  onMouseDown?: NodeMouseEventHandler
}

export const TypeToNodeRadius: Record<MetaObject['type'], number> = {
  pdf: 15,
  pdfLabel: 10,
  note: 15,
  normal: 10,
  noteLabel: 10,
  noteBlock: 10,
  image: 15,
  whiteboard: 15,
  webpage: 15,
  webpageLabel: 10,
  videoLabel: 10,
  video: 15,
  audio: 15,
  localFile: 15
}

export const getRadius = (type?: MetaObject['type']) => {
  if (!type) return 50
  if (TypeToNodeRadius[type]) {
    return TypeToNodeRadius[type]
  }
  const registeredRadius = TypeToRegisteredMetaObject.get(type)?.graphSettings?.radius
  return registeredRadius ?? 50
}
export const sliceLabel = (label?: string) => {
  if (!label) return
  if (label.length > 50) {
    return label.slice(0, 50) + '...'
  }
  return label
}
const Node: FC<NodeProps> = memo(({ node, onMouseEnter, onMouseLeave, onContextMenu, onClick }) => {
  const nodeRef = useRef<SVGGElement>(null)
  const graph = useGraph()
  const filterTags = useAtomValue(FilterSelectedTagsAtom)
  const meta = MetaStore.useValue(node.id)
  const setPathFilter = useSetAtom(GraphPathFilterAtom)
  const pinnedNodes = useAtomValue(GraphPinNodesIdsAtom)
  const graphMode = useAtomValue(GraphModeAtom)
  const dragTimer = useRef(0)
  const thisNodeShowTags = useMemo(() => {
    if (node.opacity !== 1) {
      return []
    }
    const nodeTags = meta?.tags || []
    const allSelectedTags = new Set<number>(
      Array.from(filterTags.values())
        .map(i => [...i])
        .flat(1)
    )

    const showTags = nodeTags?.filter(i => allSelectedTags.has(i))
    return showTags
  }, [filterTags, node.opacity, meta?.tags])

  const radius = getRadius(node.type || 'normal')
  const d = radius * 2
  const originNode = graph?.nodesMap?.get(node.id)
  const realNode = useMemo(() => {
    return {
      ...node,
      label: sliceLabel(meta?.name),
      coverImgSrc: meta?.coverImgSrc,
      icon: meta?.icon
    } as Partial<GraphNode>
  }, [meta, node])
  const renderNode = () => {
    if (graphMode === 'simple') {
      return (
        <>
          <circle fill="#9DB2BF" cx={radius} cy={radius} r={radius} />
          <text
            transform={`translate(${d / 2},${d})`}
            textAnchor="middle"
            fontWeight={600}
            fill={Colors.Font.Primary}
            fontSize="calc(var(--zoom-level) * 16px)"
            dy="1.6em"
          >
            {realNode.label || 'Unnamed Node'}
          </text>
        </>
      )
    }
    if (!meta) return null
    if (meta.icon) {
      return <EmojiNode node={realNode} />
    }
    if (meta.coverImgSrc) {
      return <ImageNode node={realNode} />
    }
    switch (meta.type) {
      case 'note':
      case 'whiteboard':
      case 'pdfLabel':
      case 'noteLabel':
      case 'noteBlock':
      case 'pdf':
      case 'image':
        return <IconNode node={realNode} />
      default:
        return <IconNode node={realNode} />
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
    if (graph?.isChoosingNode === 'end' && !(e.target instanceof SVGTextElement)) {
      graph.overlayManager?.setContent('pathIndicator')
      const nodeBounding = nodeRef.current?.firstElementChild?.getBoundingClientRect()
      graph.overlayManager?.setPosition({
        left: nodeBounding?.left + nodeBounding?.width + 10,
        top: nodeBounding?.top
      })
      graph.overlayManager?.open()

      setPathFilter(f => ({ ...f, tempEndNodeId: node.id }))
    }
  }
  const handleMouseLeave: MouseEventHandler = e => {
    onMouseLeave?.(e, node)
    if (graph?.isChoosingNode === 'end') {
      setPathFilter(f => {
        if (f?.tempEndNodeId === node.id) {
          graph.overlayManager?.close()
          return { ...f, tempEndNodeId: undefined }
        }
        return f
      })
    }
  }
  const handleContextMenu: MouseEventHandler = e => {
    onContextMenu?.(e, node)
  }
  const handleClick: MouseEventHandler = e => {
    e.preventDefault()

    if (graph?.isChoosingNode === 'start') {
      setPathFilter(f => ({ ...f, startNodeId: node.id }))
      graph.isChoosingNode = false
      return
    }
    if (graph?.isChoosingNode === 'end') {
      setPathFilter(f => ({ ...f, endNodeId: node.id }))
      graph.isChoosingNode = false
      return
    }
    onClick?.(e, node)
    const rect = e.currentTarget.getBoundingClientRect()
    graph?.overlayManager?.setOverlayState({
      position: {
        left: rect.left + rect.width / 2,
        top: rect.top - 10
      },
      visible: true,
      content: 'nodePopover',
      nodeId: node.id,
      metaId: node.id
    })
  }
  function drag() {
    const simulation = graph?.d3Simulation
    const n = originNode
    let restarted = false
    function dragstarted(event) {
      if (graph?.isAddingEdge) return
      dragTimer.current = Date.now()
      if (!event.active) simulation?.alphaTarget(0.1)
      event.subject.fx = n.x
      event.subject.fy = n.y
    }

    function dragged(event) {
      if (graph?.isAddingEdge) return
      const now = Date.now()
      if (now - dragTimer.current < 100) {
        return
      }
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
      if (Date.now() - dragTimer.current < 100) return
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
              <ObjectTag tag={i} small hideDelete hideSize key={i} />
            ))}
          </Content>
        </foreignObject>
      )
    }
    return null
  }
  return (
    <g
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      cursor="pointer"
      // pointerEvents={node.opacity ? (node.opacity < 1 ? 'none' : 'auto') : 'auto'}
      pointerEvents="auto"
      ref={nodeRef}
      // opacity={(node.opacity || 1) < 1 ? 0 : 1}
      opacity={node.opacity || 1}
      style={{ transition: 'opacity 0.2s ease', userSelect: 'none' }}
      transform={node.x && node.y ? `translate(${~~node.x},${~~node.y})` : undefined}
    >
      {renderNode()}
      {renderTags()}
      {pinnedNodes.has(node.id) && <SvgIconRenderer icon="park-pin" fill="#FFFF00" size={30} x={d} y={-25} />}
    </g>
  )
})

export default Node
