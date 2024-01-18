import { css } from '@emotion/css'
import { createStore, Provider } from 'jotai'
import { FC, useCallback, useEffect, useMemo, useRef, WheelEventHandler } from 'react'
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
import { globalStore } from '@/api/stores'
import { Container, Stage } from '@pixi/react'
import PixiViewport from '@/core/components/graph/components/PixiViewport'
import PixiRenderer from '@/core/components/graph/components/PixiRenderer'
import { metaLinksAtom, metaObjectsAtom } from '@/api/stores/meta/meta.store'
import { useGlobalAtomValue, usePrevious, useUpdateEffect } from '@/hooks'
import { getAllEdgesOfNodes, getRelatedNodesOfNode } from '@/core'

interface GraphContainerProps {
  edges?: GraphEdge[]
  nodes?: GraphNode[]
  type: 'canvas' | 'svg'
  store: any
}
const GraphInner: FC<GraphContainerProps> = ({ edges, nodes, type, store }) => {
  const graph = useGraph()
  const containerRef = useRef<HTMLDivElement>(null)

  const [, setEdges] = useEdges()
  const [, setNodes] = useGraphNodes()
  const allMetaObjects = useGlobalAtomValue(metaObjectsAtom)
  const allMetaLinks = useGlobalAtomValue(metaLinksAtom)

  const isAllMode = useRef(false)
  // add more nodes and links when change
  useUpdateEffect(() => {
    if (graph) {
      const nodesMap = graph.nodesMap
      if (!nodesMap) return
      const allMetaObjects = globalStore.get(metaObjectsAtom)
      setTimeout(() => {
        if (isAllMode.current) {
          const allEdges = getAllEdgesOfNodes(new Set(allMetaObjects.keys()))
          const extraNodes = Array.from(allMetaObjects.values()).filter(i => !nodesMap?.has(i.id))
          graph.addEdges(allEdges)
          graph.addNodes(extraNodes)
          setTimeout(() => {
            graph.slightRestartSimu?.()
          })
        }
        // only show new added around center node
        else {
          const centerNode = nodes.find(i => i.isCenter)
          if (centerNode) {
            const related = getRelatedNodesOfNode(centerNode.id)
            const extraNodes = related.filter(i => !nodesMap?.has(i.id))
            console.log(extraNodes)
            const keys = Array.from(nodesMap.keys())
            const allEdges = getAllEdgesOfNodes(new Set([...keys, ...extraNodes.map(i => i.id)]))
            const originNode = nodesMap.get(centerNode.id)
            originNode.fx = originNode.x
            originNode.fy = originNode.y
            graph.addNodes(extraNodes)
            graph.addEdges(allEdges)
            setTimeout(() => {
              graph.slightRestartSimu()
            })
          }
        }
      }, 1000)
    }
  }, [allMetaLinks.size, allMetaObjects.size])
  const { graphOverlayManager, renderPortal } = useGraphOverlay()
  graph && (graph.overlayManager = graphOverlayManager)
  graph && (graph.setEdges = setEdges)
  const isMinimized = useAtomValue(globalGraphMinimizedAtom, {
    store: globalStore
  })

  useEffect(() => {
    if (graph && nodes && edges) {
      graph.clear()
      graph.originNodes = null
      graph.originEdges = null

      graph.nodesMap = null
      graph.edgesMap = null
      graph.registerEdges(edges)
      graph.registerNodes(nodes)
      setEdges(edges)
      setNodes(nodes)
      if (nodes.length === allMetaObjects.size) {
        isAllMode.current = true
      } else {
        isAllMode.current = false
      }
      setTimeout(() => {
        if (containerRef.current) {
          graph.registerContainer(containerRef.current)
        }
        graph.updateLayout(true, true)
      }, 0)
    }
  }, [edges, nodes])
  if (graph) {
    graph.setNodes = setNodes
  }

  const stageRef = useRef<Stage>(null)
  const outerContainerRef = useRef<HTMLElement>(null)
  return (
    <>
      {!isMinimized && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 10
          }}
        >
          <GraphSettingPanel />
        </div>
      )}
      <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={outerContainerRef}>
        {type === 'svg' ? (
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
            {type === 'svg' && (
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  width: '100%',
                  height: '100%',
                  overflow: 'visible'
                }}
              >
                <path id="addLinkLine"></path>
              </svg>
            )}

            <EdgeContainer type={type} />
            <NodeContainer type={type} />
          </div>
        ) : (
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
                <EdgeContainer type={type} />
                <NodeContainer type={type} />
                <PixiRenderer />
              </PixiViewport>
            </Provider>
          </Stage>
        )}

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
      <GraphInner edges={edges} nodes={nodes} type="canvas" store={store} />
    </Provider>
  )
}
export default GraphContainer
