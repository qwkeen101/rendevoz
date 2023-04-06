import { useMemoizedFn } from '@/hooks'
import { metaObjectsAtom, relatedMetaObjectsMapAtom, undeletedMetaLinksAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores'
import { useAtomValue } from 'jotai/react'
import { useState } from 'react'
import { MetaObject } from '~/typings/data'
import GraphContainer from './components/GraphContainer'
import GraphThumbnail from './GraphThumbnail'
import { GraphEdge } from './types/edge'
import { GraphNode } from './types/node'
import { GlobalObjectPanelInstance } from '@/core'
export const GlobalGraphInstance: {
  open?: (centerNode: Partial<MetaObject>) => void
  close?: VoidFunction
  minimize?: VoidFunction
  maximize?: VoidFunction
} = {}

export const GlobalGraph = () => {
  const relatedObjectsMap = useAtomValue(relatedMetaObjectsMapAtom, { store: globalStore })
  const [currentNodes, setCurrentNodes] = useState<GraphNode[]>()
  const [currentEdges, setCurrentEdges] = useState<GraphEdge[]>()
  const [visible, setVisible] = useState(false)

  Object.assign(GlobalGraphInstance, {
    open: center => {
      handleToggleGraph(center)
      GlobalGraphInstance.maximize?.()
      GlobalObjectPanelInstance.close?.()
    },
    close: () => setVisible(false)
  } as Partial<typeof GlobalGraphInstance>)

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
    const metaObjectsMap = globalStore.get(metaObjectsAtom)
    const allMetaLinks = globalStore.get(undeletedMetaLinksAtom)
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
        coverImgSrc: i.coverImgSrc || (i.from?.icon ? (i.from?.icon?.startsWith('park') ? undefined : i.from?.icon) : undefined),
        type: i.type,
        isCenter: i.id === centerNode.id,
        icon: i.icon,
        objectId: i.objectId,
        tags: i.tags
      })) as GraphNode[]
      const existedNodeIds = new Set()
      nodes.forEach(n => existedNodeIds.add(n.id))
      const edges = allMetaLinks.filter(i => existedNodeIds.has(i.sourceId) && existedNodeIds.has(i.targetId))
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

export { default as GlobalGraphThumbnail } from './GraphThumbnail'
