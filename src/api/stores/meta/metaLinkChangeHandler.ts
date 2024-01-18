import { globalStore } from '@/api/stores'
import { createDraft, finishDraft } from 'immer'
import { indexedMetaLinksAtom, metaLinksAtom } from '@/api/stores/meta/meta.store'

export default () => {
  const prevIndex = globalStore.get(indexedMetaLinksAtom)
  const undeletedLinksSet = prevIndex?.undeletedLinksSet || new Set()
  const sourceIdToLinkIdsMap = new Map(prevIndex?.sourceIdToLinkIdsMap)
  const targetIdToLinkIdMap = new Map(prevIndex?.targetIdToLinkIdMap)
  const sourceIdToTargetIdsMap = new Map<number, Set<number>>(prevIndex?.sourceIdToTargetIdsMap)
  const targetIdToSourceIdsMap = new Map<number, Set<number>>(prevIndex?.targetIdToSourceIdsMap)
  const newMetaLinks = globalStore.get(metaLinksAtom)
  const relatedIdsMapDraft = createDraft(prevIndex?.relatedIdsMap || new Map<number, Set<number>>())

  const oldLinks = prevIndex?.oldLinks
  const idSet = new Set(oldLinks?.keys())
  newMetaLinks.forEach((link, id) => {
    idSet.delete(id)
    const { sourceId, targetId } = link
    const oldLink = oldLinks?.get(id)
    // early quit
    if (oldLink === link) {
      return
    }
    if (oldLink) {
      undeletedLinksSet.delete(oldLink)
    }
    if (link.deleted) {
      sourceIdToLinkIdsMap.get(sourceId)?.delete(id)
      targetIdToLinkIdMap.get(targetId)?.delete(id)
      sourceIdToTargetIdsMap.get(sourceId)?.delete(targetId)
      targetIdToSourceIdsMap.get(targetId)?.delete(sourceId)
      relatedIdsMapDraft.get(sourceId)?.delete(targetId)
      relatedIdsMapDraft.get(targetId)?.delete(sourceId)
      return
    }
    undeletedLinksSet.add(link)
    if (relatedIdsMapDraft.has(sourceId)) {
      relatedIdsMapDraft.get(sourceId)?.add(targetId)
    } else {
      relatedIdsMapDraft.set(sourceId, new Set([targetId]))
    }
    if (relatedIdsMapDraft.has(targetId)) {
      relatedIdsMapDraft.get(targetId)?.add(sourceId)
    } else {
      relatedIdsMapDraft.set(targetId, new Set([sourceId]))
    }
    if (sourceIdToLinkIdsMap.has(sourceId)) {
      sourceIdToLinkIdsMap.get(sourceId)?.add(id)
    } else {
      sourceIdToLinkIdsMap.set(sourceId, new Set([id]))
    }
    if (sourceIdToTargetIdsMap.has(sourceId)) {
      sourceIdToTargetIdsMap.get(sourceId)?.add(targetId)
    } else {
      sourceIdToTargetIdsMap.set(sourceId, new Set([targetId]))
    }
    if (targetIdToSourceIdsMap.has(targetId)) {
      targetIdToSourceIdsMap.get(targetId)?.add(sourceId)
    } else {
      targetIdToSourceIdsMap.set(targetId, new Set([sourceId]))
    }
    if (targetIdToLinkIdMap.has(targetId)) {
      targetIdToLinkIdMap.get(targetId)?.add(id)
    } else {
      targetIdToLinkIdMap.set(targetId, new Set([id]))
    }
  })
  idSet.forEach(id => {
    const link = oldLinks?.get(id)
    if (!link) return
    undeletedLinksSet.delete(link)
    const { sourceId, targetId } = link
    sourceIdToLinkIdsMap.get(sourceId)?.delete(id)
    targetIdToLinkIdMap.get(targetId)?.delete(id)
    sourceIdToTargetIdsMap.get(sourceId)?.delete(targetId)
    targetIdToSourceIdsMap.get(targetId)?.delete(sourceId)
    relatedIdsMapDraft.get(sourceId)?.delete(targetId)
    relatedIdsMapDraft.get(targetId)?.delete(sourceId)
  })
  globalStore.set(indexedMetaLinksAtom, {
    undeletedLinksSet,
    sourceIdToLinkIdsMap,
    targetIdToLinkIdMap,
    relatedIdsMap: finishDraft(relatedIdsMapDraft),
    oldLinks: newMetaLinks,
    sourceIdToTargetIdsMap,
    targetIdToSourceIdsMap
  })
}