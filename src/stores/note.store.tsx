import useDb from '@/hooks/stores/useDb'
import Id from '@/utils/id'
import { Descendant, Node } from 'slate'
import { CustomEditor, INote } from '~/typings'
import { saveBlobLocally } from '@/utils/file'
import SearchHelper from '@/textSearch/SearchHelper'
import { MetaStore, ObjectStore } from '@/stores/index'

const createNoteStore = () => {
  const blobDb = useDb('blobs')
  const saveNoteAsBuffer = async (value: Descendant[], id?: number) => {
    const realId = id || Id.getId()

    await saveBlobLocally(new Blob([JSON.stringify(value)]), String(realId), `note_${realId}.json`).then(res =>
      blobDb.put({
        id: realId,
        fileUrl: res
      })
    )
    return realId
  }
  const getNoteValue = async (id: number): Promise<Descendant[] | undefined> => {
    const value = await blobDb.get(id)
    if (value) {
      if (value.value) {
        const buffer = value.value as ArrayBuffer
        const decoder = new TextDecoder()
        const str = decoder.decode(buffer)
        const obj = JSON.parse(str)
        saveBlobLocally(new Blob([JSON.stringify(obj)]), String(id), `note_${id}.json`).then(res => {
          blobDb.put({
            id,
            fileUrl: res
          })
        })
        return obj as Descendant[]
      }
      const fileUrl = value.fileUrl
      if (fileUrl) {
        const res = await fetch(fileUrl)
        const text = await res.json()
        return text as Descendant[]
      }
    }
  }
  const saveNoteAsSearch = async (value: Descendant[], noteId: number) => {
    const note = await ObjectStore('note').getOneById(noteId)
    if (note && note.metaId) {
      const targetMeta = await MetaStore.getMetaObjectById(note.metaId)
      if (targetMeta) {
        SearchHelper.insertDocument({
          id: targetMeta.id,
          docType: 'metaObject',
          metaId: targetMeta.id,
          metaType: targetMeta.type,
          name: targetMeta.name,
          description: targetMeta.description,
          content: Node.string({ children: value })
        })
      }
    }
  }
  const initializeNoteWithValue = async (value: Descendant[], initialNote?: Partial<INote>): Promise<INote> => {
    const note = await ObjectStore('note').addOne({ ...initialNote })
    const contentId = note.contentId || Id.getId()
    await saveNoteAsBuffer(value, contentId)
    await ObjectStore('note').updateOne({ id: note.id, contentId })
    return note
  }
  return {
    saveNoteAsBuffer,
    getNoteValue,
    saveNoteAsSearch,
    initializeNoteWithValue
  }
}

export const noteStore = createNoteStore()

export default createNoteStore
