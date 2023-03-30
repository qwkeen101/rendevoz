import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import { relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import { globalStore, MetaStore } from '@/stores'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import produce from 'immer'
import { useAtom, useAtomValue } from 'jotai/react'
import { memo, MouseEvent } from 'react'
import { MetaLink } from '~/typings/data'
import useEdges from '../hooks/useEdges'
import useGraph from '../hooks/useGraph'
import useGraphNodes from '../hooks/useGraphNodes'
import { GraphNode } from '../types/node'
import Node from './node/Node'
import useGraphFilter, { GraphPinNodesIdsAtom } from '../hooks/useGraphFilter'

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
  const [nodes] = useGraphNodes()
  const [edges] = useEdges()

  const { addMetaLink } = MetaStore
  const graph = useGraph()
  const { handleNodePointerEnter, handleNodePointerLeave } = useGraphFilter()
  const nodeMouseEnterHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (nodes && edges && graph) {
      if (graph.isDragging) return
      handleNodePointerEnter(node.id)
    }
  })

  const nodeMouseLeaveHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (nodes && edges && graph) {
      if (graph.isDragging) return
      handleNodePointerLeave()
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
        // ?.filter(i => !i.hidden)
        ?.map(node => (
          <Node
            onContextMenu={nodeContextMenuHandler}
            onMouseEnter={nodeMouseEnterHandler}
            onMouseLeave={nodeMouseLeaveHandler}
            onClick={nodeClickHandler}
            node={node}
            key={node.id}
          />
        ))}
    </svg>
  )
})
export default NodeContainer
