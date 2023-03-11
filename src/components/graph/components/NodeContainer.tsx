import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import  { relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import { globalStore, MetaStore } from '@/stores'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import produce from 'immer'
import { useAtomValue } from 'jotai/react'
import { memo, MouseEvent } from 'react'
import { MetaLink } from '~/typings/data'
import useEdges from '../hooks/useEdges'
import useGraph from '../hooks/useGraph'
import useNodes from '../hooks/useNodes'
import useTags from '../hooks/useTags'
import { GraphNode } from '../types/node'
import Node from './node/Node'

export type NodeMouseEventHandler = (e: MouseEvent, node: GraphNode) => void

const svgContainerClassName = css({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
  pointerEvents: 'none'
})
export const NodeFakeHiddenOpacity = 0.1
export const NodeFullVisibleOpacity = 1
const NodeContainer = memo(() => {
  const [nodes, setNodes] = useNodes()
  const [edges, setEdges] = useEdges()
  const [selectedTags] = useTags()
  const { addMetaLink } = MetaStore
  const relatedObjectsMap = useAtomValue(relatedMetaObjectsMapAtom, { store: globalStore })
  const emitter = useGlobalEventEmitter()
  const graph = useGraph()

  const nodeMouseEnterHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (nodes && edges && graph) {
      if (graph.isDragging) return
      if (selectedTags.length > 0) return
      graph.currentHoverNode = node
      const relatedNodeIds = structuredClone(relatedObjectsMap.get(node.id))
      relatedNodeIds?.add(node.id)
      setEdges(
        produce(edges, draft => {
          edges?.forEach((e, idx) => {
            if (relatedNodeIds?.has(e.sourceId) && relatedNodeIds.has(e.targetId)) {
              draft[idx].highlight = true
            } else {
              draft[idx].opacity = 0
            }
          })
        })
      )
      setNodes(
        produce(nodes, draft => {
          const idx = nodes?.findIndex(n => n === node)
          nodes.forEach((n, idx) => {
            if (!relatedNodeIds?.has(n.id)) {
              draft[idx].opacity = 0.04
            }
          })
          draft[idx].scale = 1.2
        })
      )
      relatedNodeIds?.delete(node.id)
    }
  })
  const nodeMouseLeaveHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (nodes && edges && graph) {
      if (graph.isDragging) return
      if (selectedTags.length > 0) return
      setEdges(
        produce(edges, draft => {
          draft.forEach(i => {
            i.highlight = false
            i.opacity = 1
          })
        })
      )
      setNodes(
        produce(nodes, draft => {
          draft.forEach(i => {
            i.scale = 1
            i.opacity = 1
          })
        })
      )
    }
  })
  const nodeClickHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    e.stopPropagation()
    if (graph) {
      if (graph.isAddingEdge) {
        const startNode = graph.contextMenuNode
        const endNode = node
        if (startNode && endNode) {
          const newEdge = { sourceId: startNode.id, targetId: endNode.id, id: Id.getId() }
          if (newEdge.sourceId === newEdge.targetId) {
            graph.endAddEdge()
            return
          }
          if (edges?.some(e => e.sourceId === newEdge.sourceId && e.targetId === newEdge.targetId)) {
            graph.endAddEdge()
            return
          }
          const metaLink: Partial<MetaLink> = {
            sourceId: newEdge.sourceId,
            targetId: newEdge.targetId,
            targetType: node.type,
            sourceType: startNode.type
          }
          addMetaLink(metaLink)
          graph.registerNewAddedEdge(newEdge)
          graph.registerEdges([newEdge])
          graph.endAddEdge()
        }
      }
    }
  })
  const nodeContextMenuHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (graph) {
      graph.contextMenuNode = node
    }
    graph?.startAddEdge(e.currentTarget)
    emitter.emit('graph', {
      type: 'toggleContextMenu',
      data: {
        componentType: 'node',
        clientX: e.clientX,
        clientY: e.clientY
      }
    })
  })

  return (
    <svg className={svgContainerClassName}>
      <defs>
        <clipPath id="circleClip">
          <circle r={20} cx={20} cy={20}></circle>
        </clipPath>
        <clipPath id="roundRectClip">
          <rect width={20} height={20} rx={5}></rect>
        </clipPath>
      </defs>
      {nodes
        ?.filter(i => !i.hidden)
        ?.map(node => (
          <Node
            onContextMenu={nodeContextMenuHandler}
            onMouseEnter={nodeMouseEnterHandler}
            onMouseLeave={nodeMouseLeaveHandler}
            onClick={nodeClickHandler}
            node={node}
            key={`${node.id}`}
          />
        ))}
    </svg>
  )
})
export default NodeContainer
