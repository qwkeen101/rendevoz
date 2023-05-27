import { LayoutIdToTabMap, LayoutTab } from '@/components/layout'
import { MetaStore } from '@/stores'
import { boxContain, boxesIntersect, getRelativeBoxSize } from '@/utils'
import { Box, IImage, MetaObject } from '~/typings'

export const normalizeScreenshot = (screenshotBox: Box) => {
  const rect = screenshotBox
  const allTabs = Array.from(LayoutIdToTabMap.values())
  const intersectedTabs: LayoutTab[] = []
  const normalizedImage: Partial<IImage> = {}
  const normalizedImageMeta: Partial<MetaObject> = {
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
        relatedMeta.push(meta)

        if (onlyIntersectedtab.type === 'pdf') {
          const ele = onlyIntersectedtab.tabElement!
          const pages = ele.querySelectorAll('[data-page-index]')
          if (pages) {
            const intersectedPages: {
              pageIndex: number
              pageElement: HTMLElement
            }[] = []
            pages.forEach(page => {
              const pageRect = page.getBoundingClientRect()
              if (boxesIntersect(pageRect, rect)) {
                intersectedPages.push({
                  pageElement: page,
                  pageIndex: Number(page.getAttribute('data-page-index'))
                })
              }
            })
            normalizedImageMeta.fromObject = {
              type: 'pdf',
              metaId: meta.id,
              pages: intersectedPages.length ? intersectedPages.map(i => i.pageIndex) : undefined
            }
            // get the rect of target page
            if (intersectedPages.length === 1) {
              const intersectedPage = intersectedPages[0]
              const bounding = intersectedPage.pageElement.getBoundingClientRect()

              // if totally inside page bounding
              if (boxContain(bounding, screenshotBox)) {
                const { percentageHeight, percentageWidth, percentageX, percentageY } = getRelativeBoxSize(bounding, screenshotBox)
                normalizedImageMeta.fromObject.rect = {
                  left: percentageX,
                  top: percentageY,
                  width: percentageWidth,
                  height: percentageHeight
                }
              }
            }
          }
        }
        if (onlyIntersectedtab.type === 'note') {
          normalizedImageMeta.fromObject = {
            type: 'note',
            metaId: meta.id
          }
        }
        if (onlyIntersectedtab.type === 'webpage') {
          normalizedImageMeta.fromObject = {
            type: 'webpage',
            metaId: meta.id
          }
        }
        if (onlyIntersectedtab.type === 'whiteboard') {
          normalizedImageMeta.fromObject = {
            type: 'whiteboard',
            metaId: meta.id
          }
        }
      }
    }
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
    normalizedImage,
    normalizedImageMeta
  }
}
