import { GraphEventHandler, ToggleGlobalGraphEvent } from '@/events/graphEvent'
import useEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import useMetaStore from '@/stores/meta.store'
import { useEffect, useState } from 'react'
import { MetaObject } from '~/typings/data'
import GraphContainer from './components/GraphContainer'
import GraphThumbnail from './GraphThumbnail'
import { GraphEdge } from './types/edge'
import { GraphNode } from './types/node'

const GlobalGraph = () => {
  const { allMetaLinks, allMetaObjects } = useMetaStore()
  const [currentNodes, setCurrentNodes] = useState<GraphNode[]>()
  const [currentEdges, setCurrentEdges] = useState<GraphEdge[]>()
  const [visible, setVisible] = useState(false)
  const eventHandler = new GraphEventHandler()
  const emitter = useEventEmitter()
  const handleToggleGraph = useMemoizedFn((data: ToggleGlobalGraphEvent) => {
    const { centerNode } = data
    if (centerNode.id) {
      setVisible(true)
      const nodeIds = new Set<number>()
      nodeIds.add(centerNode.id)
      console.log(allMetaLinks)
      const edges = allMetaLinks.filter(
        i => (i.sourceId === centerNode.id || i.targetId === centerNode.id) && i.sourceId !== undefined && i.targetId !== undefined
      )
      edges.forEach(edge => {
        nodeIds.add(edge.sourceId)
        nodeIds.add(edge.targetId)
      })
      const nodes = (
        Array.from(nodeIds.values())
          .map(nodeId => allMetaObjects.find(i => i.id === nodeId))
          .filter(i => i !== undefined) as MetaObject[]
      ).map(i => ({
        id: i.id,
        label: i.keyword || i.title,
        coverImgSrc: i.coverImgSrc
      })) as GraphNode[]
      console.log(nodes, edges)
      setCurrentEdges(edges)
      setCurrentNodes(nodes)
    }
  })
  eventHandler.on('toggleGlobalGraph', handleToggleGraph)
  useEffect(() => {
    emitter.addListener('graph', eventHandler)
    return () => {
      emitter.removeListener('graph', eventHandler)
    }
  }, [])
  return (
    <>
      {visible && (
        <GraphThumbnail onClose={() => setVisible(false)}>
          <GraphContainer edges={currentEdges} nodes={currentNodes} />
        </GraphThumbnail>
      )}
    </>
  )
}

export default GlobalGraph
