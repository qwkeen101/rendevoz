import { GraphScope } from '@/jotai/jotaiScope'
import { css } from '@emotion/css'
import { createStore, Provider } from 'jotai'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import D3GraphManager from '../D3GraphManager'
import useEdges from '../hooks/useEdges'
import useGraph, { graphAtom } from '../hooks/useGraph'
import useNodes from '../hooks/useNodes'
import useGraphOverlay from './overlay/useGraphOverlay'
import { GraphEdge } from '../types/edge'
import { GraphNode } from '../types/node'
import EdgeContainer from './EdgeContainer'
import NodeContainer from './NodeContainer'
import GraphSettingPanel from './setting'
import { useAtomValue } from 'jotai/react'
import { globalGraphMinimizedAtom } from '../GraphThumbnail'
import { globalStore } from '@/stores'

interface GraphContainerProps {
  edges?: GraphEdge[]
  nodes?: GraphNode[]
  centerNodeId?: number
}
const GraphInner: FC<GraphContainerProps> = ({ edges, nodes }) => {
  const graph = useGraph()
  const containerRef = useRef<HTMLDivElement>(null)

  const [, setEdges] = useEdges()
  const [, setNodes] = useNodes()
  const { graphOverlayManager, renderPortal } = useGraphOverlay()
  graph && (graph.overlayManager = graphOverlayManager)

  const isMinimized = useAtomValue(globalGraphMinimizedAtom, { store: globalStore })

  useEffect(() => {
    if (containerRef.current && graph && nodes && edges) {
      graph.clear()
      graph.registerEdges(edges)
      graph.registerNodes(nodes)
      setEdges(edges)
      setNodes(nodes)
      setTimeout(() => {
        graph.registerContainer(containerRef.current)
        graph.updateLayout(true, true)
      }, 0)
      console.log('asdsa')
    }
  }, [edges, nodes])
  useEffect(() => {
    if (graph) {
      graph.setNodes = setNodes
    }
  })
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        className={css({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        })}
        id="viewport"
        ref={containerRef}
      >
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%', overflow: 'visible' }}>
          <path id="addLinkLine"></path>
        </svg>
        <EdgeContainer />
        <NodeContainer />
      </div>
      {!isMinimized && (
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: 20
          }}
        >
          <GraphSettingPanel />
        </div>
      )}
      {renderPortal()}
    </div>
  )
}
const GraphContainer: FC<GraphContainerProps> = ({ edges, nodes, centerNodeId }) => {
  const graphManager = useMemo(() => new D3GraphManager(), [])
  const store = useMemo(() => {
    const store = createStore()
    store.set(graphAtom, graphManager)
    return store
  }, [])
  useMemo(() => {
    graphManager.centerNodeId = centerNodeId
  },[centerNodeId])
  return (
    <Provider store={store}>
      <GraphInner edges={edges} nodes={nodes} />
    </Provider>
  )
}
export default GraphContainer
