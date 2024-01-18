import { IMediaState } from '~/typings'
import { IMediaEvent } from '~/typings/components/media/event'
import turnIntoMeta from '@/core/components/media/wrappers/turnIntoMeta'
import Id from '@/utils/id'
import { MetaStore, ObjectStore } from '@/api/stores'
import { GlobalInstance } from '@/hooks'
import useMediaLabelChapter from '@/core/components/media/wrappers/labelChapter'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import _ from 'lodash'
import FileSystem from '@/api/fileSystem'

const useMediaEventHandlerWrapper = (options: {
  mediaState: Partial<IMediaState>
  type: 'audio' | 'video'
  labelType: 'audioLabel' | 'videoLabel'
  objectId?: number
}) => {
  const { objectId, labelType, type, mediaState } = options
  const object = ObjectStore(type).useValue(objectId)
  const meta = MetaStore.useObjectToMetaValue(objectId)
  const handleLabelChapter = useMediaLabelChapter(type, labelType, mediaState, objectId)
  const handler = async (e: IMediaEvent) => {
    console.log(e)
    let id = objectId
    let metaId = meta?.id
    switch (e.type) {
      case 'transcribe':
      case 'addLabel':
      case 'addChapter':
      case 'copyTimestamp':
      case 'pin':
      case 'assignToNewCollection':
        if (!metaId) {
          const res = await turnIntoMeta(mediaState, type)
          metaId = res?.meta.id
          id = res?.one.id
        }
    }
    switch (e.type) {
      case 'transcribeFinished': {
        if (object) {
          const path = await FileSystem.fs.writeFile(e.vttText, `/files/subtitle_${Id.getStrId()}.vtt`)
          if (path) {
            await ObjectStore(type).updateOne({
              id: object.id,
              subtitleList: [{ lang: 'Transcription', url: path }, ...(object.subtitleList || [])]
            })
          }
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
      case 'assignToNewCollection':
        if (!metaId) return
        return await GlobalInstance.metaOps?.quickAdd(metaId)
      case 'pin': {
        console.log(metaId)
        if (!metaId) return
        return await MetaStore.updateMetaObject({ id: metaId, pinned: meta ? !meta.pinned : true })
      }
      case 'externalStateChange': {
        if (object) {
          const merged = _.merge({ ...object }, e.state)
          ObjectStore(type).updateOne({ ...merged })
        }
        break
      }
      case 'copyTimestamp': {
        const type = 'text/html'
        const url = `rendevoz://object/${metaId}?t=${e.currentTime}`
        const text = new Blob([url], { type: 'text/plain' })
        const blob = new Blob([`<a href="${url}">${meta?.name || mediaState.name} — ${normalizeSecondsToTime(e.currentTime)}</a>`], {
          type
        })
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': text })])
        return
      }
    }
  }
  return handler
}

export default useMediaEventHandlerWrapper
