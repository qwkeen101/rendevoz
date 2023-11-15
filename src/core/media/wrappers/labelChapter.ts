import { ObjectStore } from '@/api/stores'
import { IMediaEvent } from '~/typings/components/media/event'
import { IMediaChapter, IMediaLabel } from '~/typings'
import { MediaProps } from '@/core'
import Id from '@/utils/id'
import produce from 'immer'

const useMediaLabelChapter = (
  type: 'video' | 'audio',
  labelType: 'audioLabel' | 'videoLabel',
  mediaState: MediaProps['mediaState'],
  objectId?: number
) => {
  const object = ObjectStore(type).useValue(objectId)
  const updater = ObjectStore(type).updateOne
  const labels = object?.labels || []
  const chapters = object?.chapters || []

  const labelAndChapterEventHandler = async (e: IMediaEvent, id = objectId) => {
    if (!id) {
      return
    }
    switch (e.type) {
      case 'addChapter': {
        const currChapters = e.currentChapter
        const newChapters = [...chapters, ...currChapters] as IMediaChapter[]
        if (!chapters.length) {
          newChapters.unshift({
            startTime: 0,
            id: Id.getId(),
            name: 'Unnamed chapter',
            endTime: currChapters[0].startTime
          })
        }
        updater({ id, chapters: newChapters })
        return
      }
      case 'addLabel': {
        const newLabel = (await ObjectStore(labelType).addOne({
          ...e.currentLabel,
          specType: labelType,
          parentObjectId: id
        })) as IMediaLabel
        console.log(newLabel)
        updater({ id: id, labels: [...labels, newLabel.id] })
        return newLabel
      }
      case 'deleteLabel': {
        await updater({ id: id, labels: labels.filter(i => i !== e.labelId) })
        return
      }
      case 'deleteChapter': {
        const newChapters = chapters.filter(i => i.id !== e.id)
        updater({ id: id, chapters: newChapters })
        return
      }
      case 'updateChapter': {
        const index = chapters.findIndex(i => i.id === e.currentChapter.id)
        if (index >= 0) {
          updater({
            id,
            chapters: produce(chapters, s => {
              s[index] = { ...s[index], ...e.currentChapter }
            })
          })
        }
        return
      }
    }
  }

  return labelAndChapterEventHandler
}

export default useMediaLabelChapter
