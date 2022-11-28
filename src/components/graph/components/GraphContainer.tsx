import { GraphScope } from '@/jotai/jotaiScope'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { Provider } from 'jotai'
import { FC, MouseEventHandler, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import D3GraphManager from '../D3GraphManager'
import useEdges from '../hooks/useEdges'
import useGraph, { graphAtom } from '../hooks/useGraph'
import useNodes from '../hooks/useNodes'
import GraphOverlay from '../Overlay'
import { GraphEdge } from '../types/edge'
import { GraphNode } from '../types/node'
import EdgeContainer from './EdgeContainer'
import NodeContainer from './NodeContainer'

interface GraphContainerProps {
  edges: GraphEdge[]
  nodes: GraphNode[]
}
const GraphInner: FC<GraphContainerProps> = ({ edges: unnormalizedEdges, nodes: unnormalizedNodes }) => {
  const graph = useGraph()
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [, setEdges] = useEdges()
  const [, setNodes] = useNodes()
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const zoomHandler = (transform: any) => {
    setTransform(transform)
  }
  useEffect(() => {
    if (containerRef.current && viewportRef.current && graph) {
      setEdges(graph.registerEdges(unnormalizedEdges))
      setNodes(graph.registerNodes(unnormalizedNodes))
      setTimeout(() => {
        graph.registerContainer(containerRef.current)
        graph.registerHandler('zoom', zoomHandler)
        graph.updateLayout()
      }, 0)
    }
  }, [])
  return (
    <div id="aaa" style={{ width: 1000, height: 600, position: 'relative' }} ref={containerRef}>
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
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%',overflow: 'visible' }}>
          <path id="addLinkLine"></path>
        </svg>
        <EdgeContainer />
        <NodeContainer />
      </div>
      <GraphOverlay
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
