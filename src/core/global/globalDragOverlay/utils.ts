import { intersectionOfMultipleSets } from '@/core/database'
import { globalStore, MetaStore } from '@/stores'
import { indexedMetaLinksAtom } from '@/stores/meta.store'
import { PartialWithId } from '@/types'
import Id from '@/utils/id'
import { MetaLink, MetaObject } from '~/typings'

function countWords(str: string) {
  const matches = str.match(/[\u00ff-\uffff]|\S+/g)
  return matches || []
}
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
  const count = countWords(textContent)
  const description = count.length > 35 ? textContent : undefined
  // if (count.length > 35) {
  //   const length = count
  //     .slice(0, 35)
  //     .map(i => {
  //       if (i.match(/[\u00ff-\uffff]/g)) {
  //         return i.length
  //       } else {
  //         return i.length + 1
  //       }
  //     })
  //     .reduce((prev, curr) => prev + curr, 0)
  //   name = textContent.slice(0, length) + '...'
  // }
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
