import { globalStore, MetaStore, NoteStore, ObjectStore } from '@/stores'
import { Descendant } from 'slate'
export const fetchNoteContent = async (noteId: number) => {
  const note = await ObjectStore('note').getOneById(noteId)
  if (note && note.contentId) {
    return await NoteStore.getNoteValue(note.contentId)
  }
}

export const fetchMetaNoteContent = async (metaId: number): Promise<Descendant[] | undefined> => {
  const targetMeta = await MetaStore.getMetaObjectById(metaId)

  if (targetMeta && targetMeta.objectId) {
    if (targetMeta.type === 'note') {
      return await fetchNoteContent(targetMeta.objectId)
    } else {
      await ObjectStore('note').getAll()
      const allNotes = globalStore.get(ObjectStore('note').objectMapAtom)
      const maybeRelatedNote = Array.from(allNotes.values()).find(i => i.metaId === metaId)
      if (maybeRelatedNote) {
        return await fetchNoteContent(maybeRelatedNote.id)
      }
    }
  }
}
