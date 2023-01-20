import useEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import { GlobalScope } from '@/jotai/jotaiScope'
import useMetaStore, { relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import produce from 'immer'
import { useAtomValue } from 'jotai'
import { FC, memo, MouseEvent, useEffect } from 'react'
import { MetaLink } from '~/typings/data'
import useEdges from '../hooks/useEdges'
import useGraph from '../hooks/useGraph'
import useNodes from '../hooks/useNodes'
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
const NodeContainer = memo(() => {
  const [nodes, setNodes] = useNodes()
  const [edges, setEdges] = useEdges()
  const { addMetaLink } = useMetaStore()
  const relatedObjectsMap = useAtomValue(relatedMetaObjectsMapAtom, GlobalScope)
  const emitter = useEventEmitter()
  const graph = useGraph()
  useEffect(() => {
    graph?.registerHandler('change', changeHandler)
  }, [])
  const changeHandler = useMemoizedFn((_nodes: GraphNode[]) => {
    if (nodes) {
      setNodes(
        produce(nodes, draft => {
          _nodes.forEach(n => {
            const idx = nodes.findIndex(i => i.id === n.id)
            if (idx > -1) {
              draft[idx] = Object.assign({}, nodes[idx], n)
            } else {
              draft.push(n)
            }
          })
          if (_nodes.length < nodes.length) {
            nodes.forEach(n => {
              if (!_nodes.some(o => o.id === n.id)) {
                const idx = draft.findIndex(o => o.id === n.id)
                idx !== -1 && draft.splice(idx, 1)
              }
            })
          }
        })
      )
    }
  })
  const nodeMouseEnterHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (nodes && edges && graph) {
      if (graph.isDragging) return
      const contextMenuNode = graph.contextMenuNode
      const isAddingEdge = graph.isAddingEdge
      graph.currentHoverNode = node
      const relatedNodeIds = relatedObjectsMap.get(node.id)?.add(node.id)
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
    }
  })
  const nodeMouseLeaveHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (nodes && edges && graph) {
      if (graph.isDragging) return
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
    console.log(node)
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
    <svg className={svgContainerClassName} width={600} height={600} viewBox="-300 -300 600 600">
      <defs>
        <clipPath id="circleClip">
          <circle r={20} cx={20} cy={20}></circle>
        </clipPath>
        <clipPath id="roundRectClip">
          <rect width={20} height={20} rx={5}></rect>
        </clipPath>
      </defs>
      {nodes?.map(node => (
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
