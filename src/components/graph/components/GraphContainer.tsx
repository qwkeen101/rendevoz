import { GraphScope } from '@/jotai/jotaiScope'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { Provider } from 'jotai'
import { FC, MouseEventHandler, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import D3GraphManager from '../D3GraphManager'
import useEdges from '../hooks/useEdges'
import useGraph, { graphAtom } from '../hooks/useGraph'
import useNodes from '../hooks/useNodes'
import GraphOverlay from './overlay/Overlay'
import { GraphEdge } from '../types/edge'
import { GraphNode } from '../types/node'
import EdgeContainer from './EdgeContainer'
import NodeContainer from './NodeContainer'
import useMetaStore from '@/stores/meta.store'
import { MetaObject } from '~/typings/data'
import { useUnMount } from '@/hooks'

interface GraphContainerProps {
  edges?: GraphEdge[]
  nodes?: GraphNode[]
}
const GraphInner: FC<GraphContainerProps> = ({ edges, nodes }) => {
  const graph = useGraph()
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const { allMetaLinks, allMetaObjects } = useMetaStore()
  const [_thisEdges, setEdges] = useEdges()
  const [_thisNodes, setNodes] = useNodes()
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const zoomHandler = (transform: any) => {
    setTransform(transform)
  }
  useEffect(() => {
    if (containerRef.current && viewportRef.current && graph && nodes && edges) {
      graph.clear()
      graph.registerEdges(edges)
      graph.registerNodes(nodes)
      setEdges(edges)
      setNodes(nodes)
      setTimeout(() => {
        graph.registerContainer(containerRef.current)
        graph.registerHandler('zoom', zoomHandler)
        graph.updateLayout(true, true)
      }, 0)
    }
  }, [edges, nodes])
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={containerRef}>
      <div
        className={css({
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `translate(${transform?.x}px,${transform?.y}px) scale(${transform?.k})`
        })}
        id="viewport"
        ref={viewportRef}
      >
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%', overflow: 'visible' }}>
          <path id="addLinkLine"></path>
        </svg>
        <EdgeContainer />
        <NodeContainer />
      </div>
      <GraphOverlay
        onShowMore={() => {
          const selectedNode = graph?.contextMenuNode
          if (selectedNode && _thisEdges && _thisNodes) {
            const relatedEdges = allMetaLinks
              .filter(
                l =>
                  (l.sourceId === selectedNode.id || l.targetId === selectedNode.id) && l.sourceId !== undefined && l.targetId !== undefined
              )
              .filter(i => !_thisEdges.some(e => e.id === i.id))
            const relatedNodeIds = new Set()
            relatedEdges.forEach(e => {
              relatedNodeIds.add(e.sourceId)
              relatedNodeIds.add(e.targetId)
            })
            _thisNodes.forEach(n => {
              // delete existed nodes
              relatedNodeIds.delete(n.id)
            })
            const relatedNodes = (
              Array.from(relatedNodeIds)
                .map(id => allMetaObjects.find(o => o.id === id))
                .filter(i => i !== undefined) as MetaObject[]
            ).map(i => ({
              id: i.id,
              label: i.keyword || i.title,
              coverImgSrc: i.coverImgSrc,
              type: i.type
            })) as GraphNode[]
            if (relatedNodes.length === 0 && relatedEdges.length === 0) return
            setNodes([..._thisNodes, ...relatedNodes])
            setEdges([..._thisEdges, ...relatedEdges])
            relatedNodes.length !== 0 && graph.registerNodes(relatedNodes)
            relatedEdges.length !== 0 && graph.registerEdges(relatedEdges)
            setTimeout(() => {
              graph.updateLayout(true)
            }, 0)
          }
        }}
        onAddLink={() => {
          graph && (graph.isAddingEdge = true)
        }}
        onDeleteNode={() => {
          graph && graph.deleteNodes([graph.contextMenuNode])
        }}
      />
    </div>
  )
}
const GraphContainer: FC<GraphContainerProps> = ({ edges, nodes }) => {
  const graphManager = useMemo(() => new D3GraphManager(), [])
  return (
    <Provider scope={GraphScope} initialValues={[[graphAtom, graphManager]]}>
      <GraphInner edges={edges} nodes={nodes} />
    </Provider>
  )
}
export default GraphContainer
