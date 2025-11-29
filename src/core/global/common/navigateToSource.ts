import { IGeneralSource } from '~/typings'
import { MetaStore } from '@/api/stores'

export default async (source: IGeneralSource) => {
  switch (source.type) {
    case 'webpage': {
      if (source.feedId) {
        const feedsTab = Global.layoutOps?.hasTargetTab({
          type: 'feed'
        })
        if (feedsTab) {
          const tab = Global.layoutOps?.getTab(feedsTab)
          if (tab?.type === 'feed') {
            const instance = tab.instance
            if (instance) {
              const location = instance.getCurrentLocation?.()
              if (location?.pathname.startsWith('/feed') && location?.params?.id === source.feedId.toString()) {
                Global.layoutOps?.makeTabActive(feedsTab)
                const feedInstance = instance.getCurrentFeedInstance?.()
                if (feedInstance) {
                  if (source.blockId) {
                    if ('editorInstance' in feedInstance) {
                      const firstBlockId = Array.isArray(source.blockId) ? source.blockId[0] : source.blockId
                      await feedInstance.editorInstance?.scrollToBlock?.({
                        blockId: firstBlockId
                      })
                      if (Array.isArray(source.blockId)) {
                        feedInstance.editorInstance?.highlightBlock?.(source.blockId)
                      }
                    }
                  }
                }
                return
              }
            }
          }
        }
      }
      const meta = MetaStore.getMetaObjectByObjectId(source.objectId)
      if (meta) {
        const instance = await Global.layoutOps?.openObject<'webpage'>(meta.id)
        if (instance && source.blockId !== undefined) {
          const firstBlockId = Array.isArray(source.blockId) ? source.blockId[0] : source.blockId
          await instance.editorInstance?.scrollToBlock?.({
            blockId: firstBlockId
          })
          if (Array.isArray(source.blockId)) {
            instance.editorInstance?.highlightBlock?.(source.blockId)
          }
        }
      }
      break
    }
    case 'note': {
      const meta = MetaStore.getMetaObjectByObjectId(source.objectId)
      if (meta) {
        const instance = await Global.layoutOps?.openObject<'editor'>(meta.id)
        if (instance && source.blockId !== undefined) {
          const firstBlockId = Array.isArray(source.blockId) ? source.blockId[0] : source.blockId
          await instance.scrollToBlock?.({
            blockId: firstBlockId
          })
          if (Array.isArray(source.blockId)) {
            instance.highlightBlock?.(source.blockId)
          }
        }
      }
      break
    }
    case 'video': {
      if (source.youtubeId) {
        const youtubeTab = Global.layoutOps?.hasTargetTab({
          type: 'youtube'
        })
        if (youtubeTab) {
          const tab = Global.layoutOps?.getTab(youtubeTab)
          if (tab?.type === 'youtube') {
            const instance = tab.instance
            if (instance) {
              const location = instance.getCurrentLocation?.()
              if (location?.pathname.startsWith('/youtube/video') && location?.params?.id === source.youtubeId.toString()) {
                Global.layoutOps?.makeTabActive(youtubeTab)
                const mediaInstance = instance.getCurrentVideoInstance?.()
                if (mediaInstance) {
                  if (source.time !== undefined) {
                    mediaInstance.actionOps?.jumpTo(source.time)
                  }
                }
                return
              }
            }
          }
        }
      }
      const meta = MetaStore.getMetaObjectByObjectId(source.objectId)
      if (meta) {
        const instance = await Global.layoutOps?.openObject<'video'>(meta.id)
        if (instance && source.time !== undefined) {
          instance.actionOps?.jumpTo(source.time)
        }
      }
      break
    }
    case 'pdf': {
      const meta = MetaStore.getMetaObjectByObjectId(source.objectId)
      if (meta) {
        const instance = await Global.layoutOps?.openObject<'pdf'>(meta.id)
        if (instance && source.page !== undefined) {
          if (source.labelId) {
            instance.navigateOps?.jumpToLabel?.(source.labelId, false)
            return
          }
          if (source.selectedText && !source.wholePage) {
            instance.highlightText?.(source.selectedText, source.page)
          } else if (source.cropLabel) {
            const { page, rect } = source.cropLabel
            if (page !== undefined && rect !== undefined) {
              instance.highlightArea?.(page, rect)
            }
          } else {
            instance.navigateOps?.jumpToPage?.(source.page)
          }
        }
      }
      break
    }
    case 'audio': {
      if (source.episodeId) {
        const episodeTab = Global.layoutOps?.hasTargetTab({
          type: 'podcast'
        })
        if (episodeTab) {
          const tab = Global.layoutOps?.getTab(episodeTab)
          if (tab?.type === 'podcast') {
            const instance = tab.instance
            if (instance) {
              const location = instance.getCurrentLocation?.()
              if (location?.pathname.startsWith('/episode') && location?.params?.id === source.episodeId.toString()) {
                Global.layoutOps?.makeTabActive(episodeTab)
                const mediaInstance = instance.getCurrentAudioInstance?.()
                if (mediaInstance) {
                  if (source.time !== undefined) {
                    mediaInstance.actionOps?.jumpTo(source.time)
                  }
                }
                return
              }
            }
          }
        }
      }
      const meta = MetaStore.getMetaObjectByObjectId(source.objectId)
      if (meta) {
        const instance = await Global.layoutOps?.openObject<'audio'>(meta.id)
        if (instance && source.time !== undefined) {
          instance.actionOps?.jumpTo(source.time)
        }
      }
      break
    }
    case 'question': {
      if (source.metaId) {
        const meta = MetaStore.getCachedMetaObject(source.metaId)
        if (meta) {
          switch (meta.type) {
            case 'note':
              Global.layoutOps?.openObject<'editor'>(meta.id).then(i => {
                i?.aiOps?.scrollToQuestion(source.objectId)
              })
              break
            case 'webpage':
              Global.layoutOps?.openObject<'webpage'>(meta.id).then(i => {
                i?.editorInstance?.aiOps?.scrollToQuestion(source.objectId)
              })
              break
            case 'pdf':
              Global.layoutOps?.openObject<'pdf'>(meta.id).then(i => {
                i?.aiOps?.scrollToQuestion(source.objectId)
              })
              break
            case 'audio':
            case 'video':
              break
          }
        }
      }
      break
    }
  }
}
