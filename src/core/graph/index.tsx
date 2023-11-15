import { useMemoizedFn } from '@/hooks'
import { metaObjectsAtom, relatedMetaObjectsMapAtom, undeletedMetaLinksAtom } from '@/api/stores/meta.store'
import { globalStore } from '@/api/stores'
import { useState } from 'react'
import { MetaObject } from '~/typings/data'
import GraphContainer from './components/GraphContainer'
import GraphThumbnail from './GraphThumbnail'
import { GraphEdge } from './types/edge'
import { GraphNode } from './types/node'
import { GlobalObjectPanelInstance } from '@/core'
import { GlobalGraphAtom } from '@/scenes/GraphPage'
import { Rendevoz } from '@/core/rendevoz'

export const GlobalGraphInstance: {
  open?: (centerNode: Partial<MetaObject>, partial?: boolean) => void
  close?: VoidFunction
  minimize?: VoidFunction
  maximize?: VoidFunction
} = {}
export const traverseGetRelatedNodeIds = (centerNodeId: number, noteIds: Set<number>, partial?: boolean) => {
  const relatedObjectsMap = globalStore.get(relatedMetaObjectsMapAtom)
  noteIds.add(centerNodeId)
  const centerNodeRelatedSet = structuredClone(relatedObjectsMap.get(centerNodeId))
  centerNodeRelatedSet?.forEach(i => {
    if (noteIds.has(i)) {
      centerNodeRelatedSet.delete(i)
    }
    if (partial) {
      noteIds.add(i)
    }
  })
  // partial only get related
  if (partial) {
    return
  }
  centerNodeRelatedSet?.forEach(n => traverseGetRelatedNodeIds(n, noteIds))
}

export const getRelatedNodesOfNode = (centerNodeId: number) => {
  const nodeIds = new Set<number>()
  const metaObjectsMap = globalStore.get(metaObjectsAtom)
  traverseGetRelatedNodeIds(centerNodeId, nodeIds, true)
  const nodes = (
    Array.from(nodeIds.values())
      .map(nodeId => metaObjectsMap.get(nodeId))
      .filter(i => i) as MetaObject[]
  ).map(i => ({
    id: i.id,
    label: i.name,
    coverImgSrc: i.coverImgSrc,
    type: i.type,
    icon: i.icon,
    objectId: i.objectId
  })) as GraphNode[]
  const existedNodeIds = new Set()
  nodes.forEach(n => existedNodeIds.add(n.id))
  return nodes
}

export const getAllEdgesOfNodes = (nodeIds: Set<number>) => {
  const allMetaLinks = globalStore.get(undeletedMetaLinksAtom)
  return allMetaLinks.filter(i => nodeIds.has(i.sourceId) && nodeIds.has(i.targetId))
}

export const GlobalGraph = () => {
  const [currentNodes, setCurrentNodes] = useState<GraphNode[]>()
  const [currentEdges, setCurrentEdges] = useState<GraphEdge[]>()
  const [visible, setVisible] = useState(false)

  Object.assign(GlobalGraphInstance, {
    open: (center, partial) => {
      handleToggleGraph(center, partial)
      // GlobalGraphInstance.maximize?.()
      GlobalObjectPanelInstance.close?.()
    },
    close: () => setVisible(false)
  } as Partial<typeof GlobalGraphInstance>)

  const handleToggleGraph = useMemoizedFn((centerNode: Partial<MetaObject>, partial?: boolean) => {
    const metaObjectsMap = globalStore.get(metaObjectsAtom)
    const allMetaLinks = globalStore.get(undeletedMetaLinksAtom)
    if (centerNode.id) {
      // setVisible(true)
      const nodeIds = new Set<number>()
      traverseGetRelatedNodeIds(centerNode.id, nodeIds, partial)

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
        objectId: i.objectId
      })) as GraphNode[]
      const existedNodeIds = new Set()
      nodes.forEach(n => existedNodeIds.add(n.id))
      const edges = allMetaLinks.filter(i => existedNodeIds.has(i.sourceId) && existedNodeIds.has(i.targetId))
      globalStore.set(GlobalGraphAtom, {
        edges: [...edges],
        nodes: [...nodes]
      })
      Rendevoz.Actions.Layout.openNewTab({ data: { type: 'graph' } })
      setCurrentEdges([...edges])
      setCurrentNodes([...nodes])
    }
  })
  return null
}

export { default as GlobalGraphThumbnail } from './GraphThumbnail'
