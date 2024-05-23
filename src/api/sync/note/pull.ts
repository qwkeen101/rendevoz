import { Rendevoz } from '@/core/rendevoz'
import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'

export default async (changedIds: number[]) => {
  Rendevoz.Events.Emit.emitEventGlobally('editor', {
    type: 'refreshFromValue',
    data: {
      noteId: changedIds
    }
  })
  const noMetaIds = new Set<number>()
  changedIds.forEach(async id => {
    const meta = MetaStore.getMetaObjectByObjectId(id, true)
    if (meta) {
      const v = await NoteStore.getNoteIdValue(id)
      if (v) {
        NoteStore.saveNoteAsSearch(v, meta.id)
      }
    } else {
      noMetaIds.add(id)
    }
  })
  if (noMetaIds.size) {
    const webpages = await ObjectStore('webpage').fetchAll()
    webpages.forEach(async w => {
      if (w.noteId && noMetaIds.has(w.noteId)) {
        noMetaIds.delete(w.noteId)
        const webpageMeta = MetaStore.getMetaObjectByObjectId(w.id, true)
        if (webpageMeta) {
          const v = await NoteStore.getNoteIdValue(w.noteId)
          if (v) {
            NoteStore.saveNoteAsSearch(v, webpageMeta.id)
          }
        }
      }
    })
  }
}
