import Id from '@/utils/id'
import { NoteStore } from '@/api/stores'
import { useDb } from '@/hooks'
import createObjectStore from '@/api/stores/object/object.store'

export default () =>
  createObjectStore('note', {
    beforeAddProcess: async n => {
      if (n.contentId === undefined) {
        n.contentId = Id.getId()
        await NoteStore.saveNoteAsBuffer(
          [
            {
              type: 'paragraph',
              id: Id.getId(),
              children: [{ text: '' }]
            }
          ],
          n.contentId
        )
      }
      if (n.labels === undefined) {
        n.labels = []
      }
    },
    afterDeleteProcess: obj => {
      const blobDb = useDb('blobs')
      blobDb.delete(obj.contentId)
    }
  })
