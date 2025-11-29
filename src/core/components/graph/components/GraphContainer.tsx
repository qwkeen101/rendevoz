import { createStore, Provider } from 'jotai'
import { FC, useLayoutEffect, useMemo, useRef, useState } from 'react'
import D3GraphManager from '../D3GraphManager'
import useEdges, { GraphEdgesAtom } from '../hooks/useEdges'
import useGraph, { graphAtom } from '../hooks/useGraph'
import useGraphNodes, { GraphNodesAtom } from '../hooks/useGraphNodes'
import useGraphOverlay from './overlay/useGraphOverlay'
import { GraphEdge } from '../types/edge'
import { GraphNode } from '../types/node'
import EdgeContainer from './EdgeContainer'
import NodeContainer from './NodeContainer'
import { Stage } from '@pixi/react'
import PixiViewport from '@/core/components/graph/components/PixiViewport'
import PixiRenderer from '@/core/components/graph/components/PixiRenderer'
import GraphSidebar from '@/core/components/graph/components/GraphSidebar'
import useGraphLayout from '@/core/components/graph/hooks/useGraphLayout'
interface GraphContainerProps {
  edges?: GraphEdge[]
  nodes?: GraphNode[]
  store: any
}
const GraphInner: FC<GraphContainerProps> = ({ edges, nodes, store }) => {
  const graph = useGraph()
  const [, setEdges] = useEdges()
  const [, setNodes] = useGraphNodes()
  const { graphOverlayManager, renderPortal } = useGraphOverlay()
  useGraphLayout()
  graph && (graph.overlayManager = graphOverlayManager)

  useLayoutEffect(() => {
    if (graph && nodes && edges) {
      let updateLayout = false
      setEdges(currEdges => {
        if (edges.length !== currEdges.length) {
          updateLayout = true
        }
        const existed = new Map(currEdges?.map(i => [i.id, i]))
        return edges.map(i => ({ ...existed.get(i.id), ...i }))
      })
      setNodes(currNodes => {
        if (currNodes.length !== nodes.length) {
          updateLayout = true
        }
        const existed = new Map(currNodes?.map(i => [i.id, i]))
        return nodes.map(i => ({ ...existed.get(i.id), ...i }))
      })
      if (updateLayout) {
        graph.updateLayout(true)
      }
    }
  }, [edges, nodes])
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const stageRef = useRef<Stage>(null)
  const outerContainerRef = useRef<HTMLDivElement>(null)
  return (
    <>
      <div className={'relative w-full h-full'} ref={outerContainerRef}>
        <GraphSidebar visible={sidebarVisible} onVisiblityChange={v => setSidebarVisible(v)} />
        <Stage
          onClick={() => console.log(graph)}
          ref={stageRef}
          width={1000}
          height={800}
          options={{
            backgroundAlpha: 0,
            antialias: true,
            resolution: window.devicePixelRatio,
            autoStart: false
          }}
        >
          <Provider store={store}>
            <PixiViewport width={1000} height={1000}>
              <EdgeContainer />
              <NodeContainer />
              <PixiRenderer />
            </PixiViewport>
          </Provider>
        </Stage>
        {renderPortal()}
      </div>
    </>
  )
}
const GraphContainer: FC<Omit<GraphContainerProps, 'store'>> = ({ edges, nodes }) => {
  const graphManager = useMemo(
    () =>
      new D3GraphManager(
        () => {
          return {
            nodes: (store.get(GraphNodesAtom) || []).map(i => ({ ...i })),
            edges: (store.get(GraphEdgesAtom) || []).map(i => ({ ...i }))
          }
        },
        data => {
          if (data.nodes) {
            store.set(GraphNodesAtom, data.nodes)
          }
          if (data.edges) {
            store.set(GraphEdgesAtom, data.edges)
          }
        }
      ),
    []
  )
  const store = useMemo(() => {
    const store = createStore()
    store.set(graphAtom, graphManager)
    return store
  }, [])

  return (
    <Provider store={store}>
      <GraphInner edges={edges} nodes={nodes} store={store} />
    </Provider>
  )
}

export default GraphContainer
