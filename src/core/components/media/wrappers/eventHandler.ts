import { IGeneralSource, IMediaState } from '~/typings'
import { IMediaEvent } from '~/typings/components/media/event'
import turnIntoMeta from '@/core/components/media/wrappers/turnIntoMeta'
import Id from '@/utils/id'
import { MetaStore, ObjectStore } from '@/api/stores'
import useMediaLabelChapter from '@/core/components/media/wrappers/labelChapter'
import FileSystem from '@/api/fileSystem'
import useMediaTranscribe from '@/core/components/media/hooks/useMediaTranscribe'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { AI_SUMMARY_PROP_ID } from '@/api/stores/meta/meta.store'

const useMediaEventHandlerWrapper = (options: {
  mediaState: Partial<IMediaState>
  type: 'audio' | 'video'
  labelType: 'audioLabel' | 'videoLabel'
  objectId?: number
}) => {
  const { objectId, labelType, type, mediaState } = options
  const object = ObjectStore(type).useValue(objectId)
  const meta = MetaStore.useObjectToMetaValue(objectId)
  const { t } = useTranslation()
  const handleLabelChapter = useMediaLabelChapter(type, labelType, mediaState, objectId)
  const handler = async (e: IMediaEvent) => {
    let id = objectId
    let metaId = meta?.id
    if (e.type === 'getMeta') {
      if (!metaId) {
        const res = await turnIntoMeta(mediaState, type, e.temp)
        metaId = res?.meta.id
      }
      if (meta?.temp && !e.temp) {
        MetaStore.updateMetaObject({ id: meta.id, temp: false })
      }
      if (metaId) {
        e.onSuccess(metaId)
      }
    }
    switch (e.type) {
      case 'addLabel':
      case 'addChapter':
        if (!metaId) {
          const res = await turnIntoMeta(mediaState, type)
          metaId = res?.meta.id
          id = res?.one.id
        }
        if (meta?.temp) {
          MetaStore.updateMetaObject({ id: meta.id, temp: false })
        }
    }
    switch (e.type) {
      case 'aiSummarize':
      case 'transcribe':
      case 'transcribeFinished':
      case 'getSource':
        if (!metaId) {
          const res = await turnIntoMeta(mediaState, type, true)
          metaId = res?.meta.id
          id = res?.one.id
        }
    }
    switch (e.type) {
      case 'update': {
        if (object) {
          await ObjectStore(type).updateOne({ ...e.updater(object) })
        }
        break
      }
      case 'removeSummary': {
        if (id) {
          if (metaId) {
            MetaStore.property.updateProperty(metaId, AI_SUMMARY_PROP_ID, null)
          }
          return await ObjectStore(type).updateOne({ id, aiSummary: undefined })
        }
        break
      }
      case 'getSource': {
        return {
          type: type,
          youtubeId: mediaState.state?.ytVideoId,
          objectId: id,
          episodeId: mediaState.state?.episodeId
        } as IGeneralSource
      }
      case 'transcribeFinished': {
        if (id) {
          toast.success(t('media.Successfully transcribed'))
          const path = await FileSystem.fs.writeFile(e.vttText, `/files/subtitle_${Id.getStrId()}.vtt`)
          if (path) {
            const object = await ObjectStore(type).getOneById(id)
            if (!object) return
            const currentTranscription = object.subtitleList?.findIndex(
              i => i.lang.startsWith('Transcription') && i.lang === object.subtitleLang
            )
            if (currentTranscription !== undefined && currentTranscription >= 0) {
              const c = object.subtitleList?.[currentTranscription]
              if (c && !c.url && object.subtitleList) {
                const newList = structuredClone(object.subtitleList)
                newList[currentTranscription].url = path
                await ObjectStore(type).updateOne({
                  id: id,
                  subtitleList: newList
                })
                return path
              }
            }
            const lang = useMediaTranscribe.generateNewName('Transcription', object.subtitleList?.map(i => i.lang) ?? [])
            await ObjectStore(type).updateOne({
              id: id,
              subtitleList: [{ lang, url: path }, ...(object.subtitleList || [])]
            })
            return path
          }
        }

        break
      }
      case 'aiSummarize': {
        if (id) {
          if (metaId) {
            MetaStore.addAIForMeta(metaId, {
              summary: e.summary.summary.summary
            })
          }
          return await ObjectStore(type).updateOne({ id, aiSummary: e.summary })
        }
        break
      }
      case 'subtitleUpdated': {
        if (object) {
          console.log(e)
          return await ObjectStore(type).updateOne({
            id: object.id,
            subtitleMode: e.subtitleMode ?? mediaState.subtitleMode,
            subtitleLang: e.subtitleLang ?? mediaState.subtitleLang,
            subtitleList: e.subtitleList ?? mediaState.subtitleList,
            subtitleFollow: e.subtitleFollow ?? mediaState.subtitleFollow
          })
        }
        break
      }
      case 'addLabel':
      case 'deleteLabel':
      case 'addChapter':
      case 'deleteChapter':
      case 'updateChapter':
        if (!id) return
        return await handleLabelChapter(e, id)
      case 'currentTimeChanged': {
        if (object) {
          ObjectStore(type).updateOne({ id: object.id, currentTime: e.currentTime })
        }
        break
      }
      case 'externalStateChange': {
        if (object) {
          ObjectStore(type).updateOne({ id: object.id, ...e.state })
        }
        break
      }
    }
  }
  return handler
}

export default useMediaEventHandlerWrapper
