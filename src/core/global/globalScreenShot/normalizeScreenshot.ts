import { LayoutIdToTabMap } from '@/components/layout'
import { MetaStore, ObjectStore } from '@/stores'
import { boxContain, boxesIntersect, getRelativeBoxSize } from '@/utils'
import { Box, IImage, ILayoutTab, IMediaInstance, MetaObject } from '~/typings'

export const normalizeScreenshot = async (screenshotBox: Box, imagePath: string) => {
  const rect = screenshotBox
  const allTabs = Array.from(LayoutIdToTabMap.values())
  const intersectedTabs: ILayoutTab[] = []
  const normalizedImage: Partial<IImage> = {}
  let normalizedImageMeta: Partial<MetaObject> = {
    type: 'image',
    name: 'Unnamed Screenshot'
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
  const floatedVideoInstances = allTabs
    .filter(i => i.type === 'video')
    ?.map(i => i.instance)
    .filter(i => (i as IMediaInstance).getVideoState?.().floated === true) as (IMediaInstance | undefined)[]
  if (floatedVideoInstances.length) {
    const targetFloatedVideo = floatedVideoInstances.find(i => {
      const playerEle = i?.getPlayerElement?.()
      if (playerEle) {
        const videoBounding = playerEle.getBoundingClientRect()
        if (boxContain(videoBounding, screenshotBox)) return true
      }
      return false
    })
    if (targetFloatedVideo) {
      const videoId = targetFloatedVideo.getVideoId?.()
      if (videoId) {
        const videoMeta = MetaStore.getMetaObjectByObjectId(videoId)
        if (videoMeta) {
          normalizedImageMeta.fromObject = {
            type: 'video',
            metaId: videoMeta.id,
            time: targetFloatedVideo.getVideoState?.().currentTime
          }
          return {
            relatedMeta,
            normalizedImage,
            normalizedImageMeta
          }
        }
      }
    }
  }
  if (intersectedTabs.length === 1) {
    const onlyIntersectedtab = intersectedTabs[0]
    if ('objectId' in onlyIntersectedtab) {
      const meta = MetaStore.getMetaObjectByObjectId(onlyIntersectedtab.objectId)
      if (meta) {
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
            // get the rect of target page

            const intersectedPage = intersectedPages[0]
            const bounding = intersectedPage.pageElement.getBoundingClientRect()

            // if totally inside page bounding
            if (boxContain(bounding, screenshotBox)) {
              normalizedImageMeta.fromObject = {
                type: 'pdf',
                metaId: meta.id
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
        if (onlyIntersectedtab.type === 'video') {
          const playingVideoEle = onlyIntersectedtab.instance.getVideoElement?.()
          if (playingVideoEle) {
            const playingVideoBounding = playingVideoEle.getBoundingClientRect()
            if (boxContain(playingVideoBounding, screenshotBox)) {
              const currentTime = onlyIntersectedtab.instance.getVideoState?.().currentTime
              normalizedImageMeta.fromObject = {
                type: 'video',
                metaId: meta.id,
                time: currentTime
              }
            }
          } else {
            normalizedImageMeta.fromObject = {
              type: 'video',
              metaId: meta.id
            }
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
