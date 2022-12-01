import useEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import produce from 'immer'
import { FC, memo, MouseEvent, MouseEventHandler, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import useEdges from '../hooks/useEdges'
import useGraph from '../hooks/useGraph'
import useNodes from '../hooks/useNodes'
import { GraphNode } from '../types/node'
import Node from './node/Node'

export type NodeMouseEventHandler = (e: MouseEvent, node: GraphNode) => void

interface NodeContainerProps {}
const svgContainerClassName = css({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
  pointerEvents: 'none'
})
const NodeContainer: FC<NodeContainerProps> = memo(() => {
  const [nodes, setNodes] = useNodes()
  const [edges, setEdges] = useEdges()
  const emitter = useEventEmitter()
  const graph = useGraph()
  useEffect(() => {
    graph?.registerHandler('change', changeHandler)
  }, [])
  const changeHandler = useMemoizedFn((_nodes: GraphNode[]) => {
    console.log(_nodes)
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
      if(graph.isDragging) return
      const contextMenuNode = graph.contextMenuNode
      const isAddingEdge = graph.isAddingEdge
      graph.currentHoverNode = node
      const { sourceToTargetNodes, targetToSourceNodes, sourceToTargetEdges, targetToSourceEdges } = graph.getRelatedNodesAndEdges(node)
      setEdges(
        produce(edges, draft => {
          const invisibleIdx: number[] = []
          const highlightIdx: number[] = []
          edges?.forEach((e, idx) => {
            if (sourceToTargetEdges?.some(o => o.id === e.id) || targetToSourceEdges?.some(o => o.id === e.id)) {
              highlightIdx.push(idx)
            } else {
              invisibleIdx.push(idx)
            }
          })
          invisibleIdx.forEach(i => (draft[i].opacity = 0))
          highlightIdx.forEach(i => (draft[i].highlight = true))
        })
      )
      setNodes(
        produce(nodes, draft => {
          const idx = nodes?.findIndex(n => n === node)
          const invisibleIdx: number[] = []
          nodes.forEach((n, idx) => {
            if (!(sourceToTargetNodes.some(i => i.id === n.id) || targetToSourceNodes.some(i => i.id === n.id))) {
              if (isAddingEdge && n.id === contextMenuNode?.id) return
              if (n.id !== node.id) {
                invisibleIdx.push(idx)
              }
            }
          })
          draft[idx].scale = 1.2
          invisibleIdx.forEach(i => (draft[i].opacity = 0.04))
        })
      )
    }
  })
  const nodeMouseLeaveHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (nodes && edges && graph) {
      if(graph.isDragging) return
      const { sourceToTargetNodes, targetToSourceNodes, sourceToTargetEdges, targetToSourceEdges } = graph.getRelatedNodesAndEdges(node)
      setEdges(
        produce(edges, draft => {
          const invisibleIdx: number[] = []
          const highlightIdx: number[] = []
          edges?.forEach((e, idx) => {
            if (sourceToTargetEdges?.some(o => o.id === e.id) || targetToSourceEdges?.some(o => o.id === e.id)) {
              highlightIdx.push(idx)
            } else {
              invisibleIdx.push(idx)
            }
          })
          invisibleIdx.forEach(i => (draft[i].opacity = 1))
          highlightIdx.forEach(i => (draft[i].highlight = false))
        })
      )
      setNodes(
        produce(nodes, draft => {
          const idx = nodes?.findIndex(n => n === node)
          const invisibleIdx: number[] = []
          nodes.forEach((n, idx) => {
            if (!(sourceToTargetNodes.some(i => i.id === n.id) || targetToSourceNodes.some(i => i.id === n.id))) {
              invisibleIdx.push(idx)
            }
          })
          draft[idx].scale = 1
          invisibleIdx.forEach(i => (draft[i].opacity = 1))
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
  const svgClickHandler: MouseEventHandler = useMemoizedFn(e => {
    if (e.currentTarget === e.target) {
      graph && graph.endAddEdge()
    }
  })
  return (
    <svg onClick={svgClickHandler} className={svgContainerClassName} width={600} height={600} viewBox="-300 -300 600 600">
      <defs>
        <clipPath id="circleClip">
          <circle r={20} cx={20} cy={20}></circle>
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
