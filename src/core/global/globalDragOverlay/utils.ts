import { intersectionOfMultipleSets } from '@/core/database'
import { MetaStore, globalStore } from '@/stores'
import { indexedMetaLinksAtom } from '@/stores/meta.store'
import { PartialWithId } from '@/types'
import Id from '@/utils/id'
import { MetaLink, MetaObject } from '~/typings'

export const transformTextContentToNameAndDescription = (
  textContent?: string
): {
  name: string | undefined
  description: string | undefined
} => {
  if (!textContent) {
    return {
      name: undefined,
      description: undefined
    }
  }
  let name = textContent
  const description = textContent.length > 100 ? textContent : undefined
  if (textContent.length > 100) {
    name = textContent?.slice(0, 100) + '...'
  }
  return {
    name,
    description
  }
}

export const createLink = (sourceMetaId: number, targetMetaId: number): PartialWithId<MetaLink> => {
  return {
    sourceId: sourceMetaId,
    targetId: targetMetaId,
    id: Id.getId()
  }
}

export const addLinkBetweenTwoMetaObject = (metaSource: MetaObject, metaTarget: MetaObject) => {
  const linkIndex = globalStore.get(indexedMetaLinksAtom)
  if (linkIndex) {
    const sourceToLinks = linkIndex.sourceIdToLinkIdsMap.get(metaSource.id)
    const targetToLinks = linkIndex.targetIdToLinkIdMap.get(metaTarget.id)
    if (sourceToLinks && targetToLinks) {
      const size = intersectionOfMultipleSets(sourceToLinks, targetToLinks).size
      if (size === 0) {
        MetaStore.addMetaLink({
          sourceId: metaSource.id,
          targetId: metaTarget.id
        })
      }
    }
  }
}
