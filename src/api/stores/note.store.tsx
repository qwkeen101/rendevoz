import useDb from '@/hooks/stores/useDb'
import Id from '@/utils/id'
import { Descendant, Node } from 'slate'
import { IEditorInstance, ILayoutTab, INote } from '~/typings'
import SearchHelper from '@/api/textSearch/SearchHelper'
import { MetaStore, ObjectStore } from '@/api/stores/index'
import FileSystem from '@/api/fileSystem'
import { Rendevoz } from '@/core/rendevoz'
import normalizeChildrenToText from '@/core/components/editor/utils/normalize/normalizeChildrenToText'

const createNoteStore = () => {
  const blobDb = useDb('blobs')
  const saveNoteAsBuffer = async (value: Descendant[], id?: number) => {
    const realId = id || Id.getId()

    await FileSystem.fs.writeFile(new Blob([JSON.stringify(value)]), `/files/note_${realId}.json`).then(res =>
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
        FileSystem.fs.writeFile(new Blob([JSON.stringify(obj)]), `/files/note_${id}.json`).then(res => {
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
  const saveNoteAsSearch = async (value: Descendant[], metaId?: number) => {
    if (metaId) {
      const targetMeta = MetaStore.getCachedMetaObject(metaId)
      console.log(targetMeta, value)
      if (targetMeta) {
        SearchHelper.insertDocument({
          id: targetMeta.id,
          docType: 'metaObject',
          metaId: targetMeta.id,
          metaType: targetMeta.type,
          name: targetMeta.name || targetMeta.placeholderName,
          description: targetMeta.description,
          content: normalizeChildrenToText(value)
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
  const addElementIntoNote = async (
    element: Descendant[],
    noteId: number,
    options?: {
      position?: 'last' | 'first'
    }
  ) => {
    const note = await ObjectStore('note').getOneById(noteId)
    if (note && note.contentId) {
      const value = await getNoteValue(note.contentId)
      if (value) {
        const newValue = options?.position === 'first' ? [...element, ...value] : [...value, ...element]
        saveNoteAsBuffer(newValue, note.contentId)
        saveNoteAsSearch(newValue, noteId)
      }
    }
  }
  // should update opened notes
  const updateNoteValue = async (newValue: Descendant[] | ((currentValue: Descendant[]) => Descendant[]), noteId: number) => {
    const note = await ObjectStore('note').getOneById(noteId)
    if (note && note.contentId) {
      const currValue = (await getNoteValue(note.contentId)) || []
      const nextValue = typeof newValue === 'function' ? newValue(currValue) : newValue
      await saveNoteAsBuffer(nextValue, note.contentId)
      const openNote = Rendevoz.Actions.Layout.getTab({
        type: 'note',
        objectId: noteId
      })
      console.log(openNote)
      if (openNote) {
        const instance = openNote.instance as IEditorInstance
        instance.replaceChildren?.(nextValue)
      }
      saveNoteAsSearch(nextValue, noteId)
    }
  }
  const getNoteIdValue = async (noteId: number) => {
    const note = await ObjectStore('note').getOneById(noteId)
    if (note) {
      const contentId = note.contentId
      if (contentId) {
        const value = await getNoteValue(contentId)
        return value
      }
    }
  }
  return {
    saveNoteAsBuffer,
    getNoteValue,
    saveNoteAsSearch,
    initializeNoteWithValue,
    getNoteIdValue,
    addElementIntoNote,
    updateNoteValue
  }
}

export const noteStore = createNoteStore()

export default createNoteStore
