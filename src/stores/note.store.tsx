import useDb from '@/hooks/stores/useDb'
import Id from '@/utils/id'
import { atom } from 'jotai'
import { toast } from 'react-hot-toast'
import { Descendant } from 'slate'
import { INote } from '~/typings/data'
import BaseStore from './base.store'
import { IStore } from './store.type'
import { globalStore, metaStore } from '.'
import { Notification } from '@/components'
import ClassName from '@/styles/classNames'
import getSetting from '@/components/globalSetting/getSetting'

const { orderedData } = BaseStore

export const notesAtom = atom(new Map<number, INote>())

export const allNotesAtom = atom(get => orderedData(get(notesAtom)).filter(i => !i.metaId))

export const undeletedNotesAtom = atom(get => get(allNotesAtom).filter(i => !i.deleted))

export const pinnedNotesAtom = atom(get => get(undeletedNotesAtom).filter(i => i.pinned))

const createNoteStore = () => {
  const { bulkAdd, dispatch, initBaseObject } = BaseStore

  const shouldToast = (silent?: boolean) => {
    const setting = getSetting()
    if (setting.notification.enabled && setting.notification.editor && !silent) {
      return true
    }
    return false
  }

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
        note.contentId = Id.getId()
        dispatch({
          type: 'add',
          data: note,
          database: noteDb,
          atom: notesAtom,
          onSuccess: async obj => {
            if (!obj.metaId) {
              await metaStore.addMetaObject(
                {
                  id: Id.getId(),
                  type: 'note',
                  objectId: obj.id
                },
                true
              )
            }
            !silent &&
              shouldToast(silent) &&
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
            !silent && shouldToast(silent) && toast.success(<Notification title="Note successfully updated!" />)
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
    addNote: localStore.addOne,
    deleteNote: localStore.deleteOneById,
    updateNote: localStore.updateOne,
    fetchNoteById: localStore.fetchOneById,
    getNoteById: localStore.getOneById
  }

  const getNotesByIds = (noteIds: number[]) => {
    return noteDb.bulkGet(noteIds)
  }

  const getBlockById = (id: number) => {
    return blockDb.get(id)
  }

  const saveBlocks = (blocks: Descendant[]) => {
    return blockDb.bulkPut(blocks)
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
  return {
    getNotesByIds,
    getNoteAndBlocks,
    saveNoteAsBuffer,
    getNoteValue,
    saveBlocks,
    getBlockById,
    ...realStore
  }
}

export const noteStore = createNoteStore()

export default createNoteStore
