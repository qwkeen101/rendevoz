import useDb from '@/hooks/stores/useDb'
import Id from '@/utils/id'
import { atom } from 'jotai'
import { Descendant, Node } from 'slate'
import { INote } from '~/typings/data'
import { SearchStore, SearchableDocument } from './search.store'
import { CustomEditor } from '~/typings'
import { Element } from 'slate'
import { saveBlobLocally } from '@/utils/file'

export const notesAtom = atom(new Map<number, INote>())

const createNoteStore = () => {
  const blobDb = useDb('blobs')
  const saveNoteAsBuffer = async (value: Descendant[], id?: number) => {
    const realId = id || Id.getId()

    await saveBlobLocally(new Blob([JSON.stringify(value)]), String(realId), `note_${realId}.json`).then(res =>
      blobDb.put({
        id: realId,
        fileUrl: res.data
      })
    )
    return realId
  }
  const getNoteValue = async (id: number) => {
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
            fileUrl: res.data
          })
        })
        return obj as Descendant[]
      }
      const fileUrl = value.fileUrl
      if (fileUrl) {
        const res = await fetch(fileUrl)
        const text = await res.text()
        const obj = JSON.parse(text)
        console.log(obj, id)
        return obj as Descendant[]
      }
    }
  }
  const saveNoteAsSearch = async (editor: CustomEditor, noteId: number) => {
    const currentBlocks = await SearchStore.searchDocument({
      specType: 'noteBlock',
      filter: [`targetObjectId=${noteId}`]
    })
    const currentSearchableBlocksIdSet = new Set(currentBlocks.map(i => Number(i.doc.id)))
    const result = editor.children
      .map(i => {
        if (Element.isElement(i)) {
          currentSearchableBlocksIdSet.delete(i.id)
          const str = Node.string(i).replaceAll('\n', '')
          if (str.length) {
            return {
              content: str,
              id: i.id,
              specType: 'noteBlock',
              targetObjectId: noteId
            } as SearchableDocument
          }
        }
      })
      .filter(i => i !== undefined && i.id) as SearchableDocument[]
    // have deleted blocks
    if (currentSearchableBlocksIdSet.size > 0) {
      SearchStore.deleteDocuments(Array.from(currentSearchableBlocksIdSet.values()))
    }
    SearchStore.addDocuments(result)
  }

  return {
    saveNoteAsBuffer,
    getNoteValue,
    saveNoteAsSearch
  }
}

export const noteStore = createNoteStore()

export default createNoteStore
