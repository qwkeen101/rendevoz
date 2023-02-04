import { CustomEditor } from '@/components/editor/types'
import useDb from '@/hooks/stores/useDb'
import Id from '@/utils/id'
import { atom } from 'jotai/vanilla'
import { useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { Descendant } from 'slate'
import { INote } from '~/typings/data'
import BaseStore from './base.store'
import { IStore } from './store.type'
import { globalStore } from './stores'
import { Notification } from '@/components'
import ClassName from '@/styles/classNames'
import { useSetting } from '@/components/globalSetting/Main'
import { useMemoizedFn } from '@/hooks'

const { orderedData } = BaseStore

export const notesAtom = atom(new Map<number, INote>())

export const allNotesAtom = atom(get => orderedData(get(notesAtom)).filter(i => !i.metaId))

export const undeletedNotesAtom = atom(get => get(allNotesAtom).filter(i => !i.deleted))

export const pinnedNotesAtom = atom(get => get(undeletedNotesAtom).filter(i => i.pinned))

const useNoteStore = () => {
  const { add, get, update, bulkAdd, dispatch, initBaseObject } = BaseStore
  const [setting] = useSetting()
  const shouldToast = setting.notification.enabled && setting.notification.editor
  const noteDb = useDb('notes')
  const blockDb = useDb('blocks')
  const blobDb = useDb('blobs')

  const localStore: IStore<INote> = {
    getAll: async () => {
      const array = await noteDb.toArray()
      globalStore.set(notesAtom, bulkAdd(array, globalStore.get(notesAtom)))
      return true
    },
    getOneById: id => {
      return new Promise(res => {
        res(globalStore.get(notesAtom).get(id))
      })
    },
    fetchOneById: id => localStore.getOneById(id),
    addOne: (n, silent) => {
      return new Promise(res => {
        const note = initBaseObject(n)
        note.title = note.title || 'Untitled'
        dispatch({
          type: 'add',
          data: note,
          database: noteDb,
          atom: notesAtom,
          onSuccess: obj => {
            !silent && shouldToast &&
              toast.success(
                <Notification
                  title="Note successfully added!"
                  content={<div className={ClassName.description()}>Title: {obj.title}</div>}
                />
              )
            res(obj)
          }
        })
      })
    },
    updateOne: (n, silent) => {
      return new Promise(res => {
        dispatch({
          type: 'update',
          data: n,
          database: noteDb,
          atom: notesAtom,
          onSuccess: obj => {
            !silent && shouldToast && toast.success(<Notification title="Note successfully updated!" />)
            res(obj)
          }
        })
      })
    },
    deleteOneById: (id, silent) => {
      return localStore.updateOne({ id, deleted: true }, silent).then(data => (data ? true : false))
    }
  }
  const realStore = {
    getAllNotes: localStore.getAll,
    addNote: useMemoizedFn(localStore.addOne),
    deleteNote: useMemoizedFn(localStore.deleteOneById),
    updateNote: useMemoizedFn(localStore.updateOne),
    fetchNoteById: localStore.fetchOneById,
    getNoteById: localStore.getOneById
  }

  const saveNote = (note: Partial<INote>) => {
    if (note.id) {
      return noteDb
        .get(note.id)
        .then(n => {
          return {
            ...n,
            ...note,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            allBlockIds: n?.allBlockIds || [],
            subBlockIds: n?.subBlockIds || []
          }
        })
        .then(n => {
          setNotes(add(n, notes))
          noteDb.put(n)
          return n
        })
    }
  }

  const getNotesByIds = (noteIds: number[]) => {
    return noteDb.bulkGet(noteIds)
  }
  const findParentNotes = (rootNoteId: number) => {
    const parentPath: INote[] = []
    const buildParentPath = (noteId: number, path: INote[]) => {
      return getNoteById(noteId).then(
        note => {
          path.unshift(note)
          if (note.parentNoteId) {
            buildParentPath(note.parentNoteId, path)
          }
        },
        rej => {
          return
        }
      )
    }
    return buildParentPath(rootNoteId, parentPath).then(() => parentPath)
  }
  const getBlockById = (id: number) => {
    return blockDb.get(id)
  }
  const findSubNotes = (rootNoteId: number): Promise<INote[]> => {
    return new Promise(resolve => resolve(all.filter(i => i.parentNoteId === rootNoteId)))
  }
  const saveBlocks = (blocks: Descendant[]) => {
    return blockDb.bulkPut(blocks)
  }
  const saveNoteAndBlocks = (editor: CustomEditor, blocks: []) => {
    if (!blocks[0]) return
    // const saveNoteItem = noteDb
    //   .get(blocks[0].noteId)
    //   .then((note: INote) => {
    //     note.subBlockIds = editor.children.map(i => i.id)
    //     const newBlockIds = blocks.map(i => i.id)
    //     const deletedBlockIds = note.allBlockIds.filter(i => !newBlockIds.includes(i))
    //     note.allBlockIds = newBlockIds
    //     note.updatedAt = Date.now()
    //     blockDb.bulkDelete(deletedBlockIds)
    //     bulkDeleteFromSearchDb(deletedBlockIds)
    //     return note
    //   })
    // .then(note => noteDb.put(note))
    const saveBlocks = blockDb.bulkPut(blocks)
    // const searchItems: SearchableItem[] = blocks.map(i => ({
    //   itemId: i.id,
    //   itemType: 'block',
    //   fields: {
    //     plainText: i.plain
    //   }
    // }))
    // const importIntoSearch = bulkImportIntoSearchDb(searchItems)
    return Promise.all([saveBlocks])
  }
  const getNoteAndBlocks = (noteId: number) => {
    return noteDb.get(noteId).then(note => {
      return Promise.all([note, blockDb.bulkGet(note?.allBlockIds || [])])
    })
  }

  const saveNoteAsBuffer = (value: Descendant[], id?: number) => {
    const realId = id || Id.getId()
    const encoder = new TextEncoder()
    const arrayBuffer = encoder.encode(JSON.stringify(value))
    blobDb.put({
      id: realId,
      value: arrayBuffer
    })
    return realId
  }
  const getNoteValue = async (id: number) => {
    const value = await blobDb.get(id)
    if (value) {
      const buffer = value.value as ArrayBuffer
      const decoder = new TextDecoder()
      const str = decoder.decode(buffer)
      const obj = JSON.parse(str)
      return obj as Descendant[]
    }
  }
  return useMemo(
    () => ({
      findParentNotes,
      findSubNotes,
      saveNote,
      getNotesByIds,
      saveNoteAndBlocks,
      getNoteAndBlocks,
      saveNoteAsBuffer,
      getNoteValue,
      saveBlocks,
      getBlockById,
      ...realStore
    }),
    []
  )
}

export default useNoteStore
