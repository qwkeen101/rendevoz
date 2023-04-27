import { LayoutIdToTabMap, LayoutTab } from '@/components/layout'
import { MetaStore } from '@/stores'
import { boxesIntersect } from '@/utils'
import { Box, IImage, MetaObject } from '~/typings'

export const normalizeScreenshot = (screenshotBox: Box) => {
  const rect = screenshotBox
  const allTabs = Array.from(LayoutIdToTabMap.values())
  const intersectedTabs: LayoutTab[] = []
  const normalizedImage: Partial<IImage> = {}
  const relatedMeta: MetaObject[] = []
  allTabs.forEach(i => {
    const ele = i.tabElement
    if (ele) {
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
        relatedMeta.push(meta)
      }
    }
    if (onlyIntersectedtab.type === 'pdf') {
      const ele = onlyIntersectedtab.tabElement!
      const pages = ele.querySelectorAll('[data-page-index]')
      if (pages) {
        const intersectedPages: number[] = []
        pages.forEach(page => {
          const pageRect = page.getBoundingClientRect()
          if (boxesIntersect(pageRect, rect)) {
            intersectedPages.push(Number(page.getAttribute('data-page-index')))
          }
        })
        normalizedImage.from = {
          type: 'pdf',
          pdfId: onlyIntersectedtab.objectId,
          pages: intersectedPages.length ? intersectedPages : undefined
        }
      }
    }
    if (onlyIntersectedtab.type === 'note') {
      normalizedImage.from = {
        type: 'note',
        noteId: onlyIntersectedtab.objectId
      }
    }
    // if (onlyIntersectedtab.type === 'webpage') {
    // }
    // if (onlyIntersectedtab.type === 'whiteboard') {
    // }
  }
  if (intersectedTabs.length > 1) {
    const relatedObjects = intersectedTabs
      .filter(i => ['pdf', 'note', 'webpage', 'whiteboard'].includes(i.type))
      .map(i => 'objectId' in i && i.objectId)
      .filter(i => typeof i === 'number') as number[]
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
    normalizedImage
  }
}
