import { useMemoizedFn } from '@/hooks'
import { GlobalScope } from '@/jotai/jotaiScope'
import useMetaStore, { metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import { useAtomValue } from 'jotai'
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
  const { allMetaLinks } = useMetaStore()
  const metaObjectsMap = useAtomValue(metaObjectsAtom, GlobalScope)
  const relatedObjectsMap = useAtomValue(relatedMetaObjectsMapAtom, GlobalScope)
  const [currentNodes, setCurrentNodes] = useState<GraphNode[]>()
  const [currentEdges, setCurrentEdges] = useState<GraphEdge[]>()
  const [visible, setVisible] = useState(false)

  GlobalGraphInstance = {
    open: center => handleToggleGraph(center),
    close: () => setVisible(false)
  }
  const traverseGetRelatedNodeIds = (centerNodeId: number, noteIds: Set<number>) => {
    noteIds.add(centerNodeId)
    const centerNodeRelatedSet = structuredClone(relatedObjectsMap.get(centerNodeId))
    centerNodeRelatedSet?.forEach(i => {
      if (noteIds.has(i)) {
        centerNodeRelatedSet.delete(i)
      }
    })
    centerNodeRelatedSet?.forEach(n => traverseGetRelatedNodeIds(n, noteIds))
  }
  const handleToggleGraph = useMemoizedFn((centerNode: Partial<MetaObject>) => {
    if (centerNode.id) {
      setVisible(true)
      const nodeIds = new Set<number>()
      traverseGetRelatedNodeIds(centerNode.id, nodeIds)

      const nodes = (
        Array.from(nodeIds.values())
          .map(nodeId => metaObjectsMap.get(nodeId))
          .filter(i => i) as MetaObject[]
      ).map(i => ({
        id: i.id,
        label: i.name,
        coverImgSrc: i.coverImgSrc,
        type: i.type,
        isCenter: i.id === centerNode.id,
        objectId: i.objectId
      })) as GraphNode[]
      const existedNodeIds = new Set()
      nodes.forEach(n => existedNodeIds.add(n.id))
      const edges = allMetaLinks.filter(i => existedNodeIds.has(i.sourceId) && existedNodeIds.has(i.targetId))
      console.log(nodeIds, nodes)
      setCurrentEdges(edges)
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
