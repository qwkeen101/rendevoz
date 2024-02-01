import { metaObjectsAtom, relatedMetaObjectsMapAtom, undeletedMetaLinksAtom } from '@/api/stores/meta/meta.store'
import { globalStore } from '@/api/stores'
import { MetaObject } from '~/typings/data'
import { GraphNode } from './types/node'
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
