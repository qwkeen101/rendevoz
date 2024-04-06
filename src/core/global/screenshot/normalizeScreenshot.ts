import { LayoutIdToTabMap } from '@/components/layout'
import { MetaStore } from '@/api/stores'
import { boxesIntersect } from '@/utils'
import { Box, IImage, ILayoutTab, MetaObject } from '~/typings'

export const normalizeScreenshot = async (screenshotBox: Box, imagePath: string) => {
  const rect = screenshotBox
  const allTabs = Array.from(LayoutIdToTabMap.values())
  const intersectedTabs: ILayoutTab[] = []
  const normalizedImage: Partial<IImage> = {}
  let normalizedImageMeta: Partial<MetaObject> = {
    type: 'image'
  }
  const relatedMeta: MetaObject[] = []
  allTabs.forEach(i => {
    const ele = i.tabElement
    if (ele) {
      if (ele.style.contentVisibility === 'hidden') return
      const box = ele.getBoundingClientRect()
      if (boxesIntersect(box, rect)) {
        intersectedTabs.push(i)
      }
    }
  })
  if (intersectedTabs.length === 1) {
    const onlyIntersectedtab = intersectedTabs[0]
    if ('objectId' in onlyIntersectedtab) {
      const meta = MetaStore.getMetaObjectByObjectId(onlyIntersectedtab.objectId)
      if (meta) {
        normalizedImageMeta.fromObject = {
          type: meta.type,
          metaId: meta.id
        }
      }
    }
  }
  if (intersectedTabs.length > 1) {
    const relatedObjects = intersectedTabs.map(i => 'objectId' in i && i.objectId).filter(i => typeof i === 'number') as number[]
    relatedObjects
      .map(i => MetaStore.getMetaObjectByObjectId(i))
      .forEach(i => {
        if (typeof i === 'object') {
          relatedMeta.push(i)
        }
      })
  }

  return {
    relatedMeta,
    normalizedImage,
    normalizedImageMeta
  }
}
