import { useDb } from '@/hooks'
import { NoteStore, ObjectStore } from '@/api/stores'
import getInsideMetas from '@/core/components/editor/utils/getInsideMetas'

export default async () => {
  const metaDb = useDb('metaObjects')
  const allNotes = await metaDb.filter(o => o.type === 'note').toArray()
  allNotes.forEach(i => {
    requestIdleCallback(async () => {
      const note = await ObjectStore('note').fetchOneById(i.objectId)
      if (!note) {
        return
      }
      if (!note.insideMetas) {
        const value = await NoteStore.getNoteIdValue(i.objectId)
        if (value) {
          const insideMetas = getInsideMetas(value)
          ObjectStore('note').updateOne({ id: note.id, insideMetas })
        }
      }
    })
  })
}
