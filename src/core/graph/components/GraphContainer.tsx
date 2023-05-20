import { css } from '@emotion/css'
import { createStore, Provider } from 'jotai'
import { FC, useEffect, useMemo, useRef } from 'react'
import D3GraphManager from '../D3GraphManager'
import useEdges from '../hooks/useEdges'
import useGraph, { graphAtom } from '../hooks/useGraph'
import useGraphNodes from '../hooks/useGraphNodes'
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
}
const GraphInner: FC<GraphContainerProps> = ({ edges, nodes }) => {
  const graph = useGraph()
  const containerRef = useRef<HTMLDivElement>(null)

  const [, setEdges] = useEdges()
  const [, setNodes] = useGraphNodes()
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
    }
  }, [edges, nodes])
  if (graph) {
    graph.setNodes = setNodes
  }

  return (
    <>
      {!isMinimized && (
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: 10,
            zIndex: 10
          }}
        >
          <GraphSettingPanel />
        </div>
      )}
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

        {renderPortal()}
      </div>
    </>
  )
}
const GraphContainer: FC<GraphContainerProps> = ({ edges, nodes }) => {
  const graphManager = useMemo(() => new D3GraphManager(), [])
  const store = useMemo(() => {
    const store = createStore()
    store.set(graphAtom, graphManager)
    return store
  }, [])

  return (
    <Provider store={store}>
      <GraphInner edges={edges} nodes={nodes} />
    </Provider>
  )
}
export default GraphContainer
