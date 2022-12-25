import { useMemoizedFn } from '@/hooks'
import useMetaStore from '@/stores/meta.store'
import { useState } from 'react'
import { MetaObject } from '~/typings/data'
import GraphContainer from './components/GraphContainer'
import GraphThumbnail from './GraphThumbnail'
import { GraphEdge } from './types/edge'
import { GraphNode } from './types/node'

export let GlobalGraphInstance:
  | {
      open: (centerNode: Partial<MetaObject>) => void
      close: VoidFunction
    }
  | undefined = undefined
const GlobalGraph = () => {
  const { allMetaLinks, allMetaObjects } = useMetaStore()
  const [currentNodes, setCurrentNodes] = useState<GraphNode[]>()
  const [currentEdges, setCurrentEdges] = useState<GraphEdge[]>()
  const [visible, setVisible] = useState(false)

  GlobalGraphInstance = {
    open: center => handleToggleGraph(center),
    close: () => setVisible(false)
  }
  const handleToggleGraph = useMemoizedFn((centerNode: Partial<MetaObject>) => {
    if (centerNode.id) {
      setVisible(true)
      const nodeIds = new Set<number>()
      nodeIds.add(centerNode.id)
      console.log(allMetaLinks)
      const edgeIds = new Set<number>()
      const edges = allMetaLinks.filter(
        i => (i.sourceId === centerNode.id || i.targetId === centerNode.id) && i.sourceId !== undefined && i.targetId !== undefined
      )
      edges.forEach(edge => {
        nodeIds.add(edge.sourceId)
        nodeIds.add(edge.targetId)
        edgeIds.add(edge.id)
      })
      const nodes = (
        Array.from(nodeIds.values())
          .map(nodeId => allMetaObjects.find(i => i.id === nodeId))
          .filter(i => i !== undefined) as MetaObject[]
      ).map(i => ({
        id: i.id,
        label: i.keyword || i.title,
        coverImgSrc: i.coverImgSrc,
        type: i.type,
        isCenter: i.id === centerNode.id
      })) as GraphNode[]
      nodes.forEach(n => {
        const sourceEdges = allMetaLinks.filter(l => l.sourceId === n.id)
        const targetEdges = allMetaLinks.filter(l => l.targetId === n.id)
        sourceEdges.forEach(i => {
          if (nodes.some(o => o.id === i.targetId)) {
            edgeIds.add(i.id)
          }
        })
        targetEdges.forEach(i => {
          if (nodes.some(o => o.id === i.sourceId)) {
            edgeIds.add(i.id)
          }
        })
      })
      const allEdges = allMetaLinks.filter(l => edgeIds.has(l.id))
      setCurrentEdges(allEdges)
      setCurrentNodes(nodes)
    }
  })

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
