import { MetaStore } from '@/api/stores'

export const traverseGetRelatedNodeIds = (centerNodeId: number, noteIds: Set<number>, partial?: boolean) => {
  const relatedObjectsMap = MetaStore.getIndexedMetaLinks().relatedIdsMap
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
