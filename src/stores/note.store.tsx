import useDb from '@/hooks/stores/useDb'
import Id from '@/utils/id'
import { atom } from 'jotai'
import { toast } from 'react-hot-toast'
import { Descendant } from 'slate'
import { INote, NoteBlock } from '~/typings/data'
import BaseStore, { initializeLocalStore } from './base.store'
import { IStoreDeprecated } from './store.type'
import { MetaStore } from '.'
import { Notification } from '@/components'
import ClassName from '@/styles/classNames'
import getSetting from '@/core/setting/getSetting'

export const notesAtom = atom(new Map<number, INote>())

const createNoteStore = () => {
  const { initBaseObject } = BaseStore

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
  const initalizedLocalStore = initializeLocalStore(notesAtom, noteDb)

  const localStore: Omit<IStoreDeprecated<INote>, 'addOne'> & {
    addOne: (n: Partial<INote>, silent?: boolean, preventAddMeta?: boolean) => Promise<INote>
  } = {
    getAll: initalizedLocalStore.getAll(),
    getOneById: initalizedLocalStore.getOneById(),
    fetchOneById: id => localStore.getOneById(id),
    addOne: (n, silent, preventAddMeta) => {
      const note = initBaseObject(n)
      note.title = note.title || 'Untitled'
      note.contentId = Id.getId()
      return initalizedLocalStore.addOne(async obj => {
        if (!obj.metaId && !preventAddMeta) {
          await MetaStore.addMetaObject(
            {
              id: Id.getId(),
              type: 'note',
              objectId: obj.id
            },
            true
          )
        }
        shouldToast(silent) &&
          toast.success(
            <Notification title="Note successfully added!" content={<div className={ClassName.description()}>Title: {obj.title}</div>} />
          )
      })(n, silent)
    },
    updateOne: (n, silent) => {
      return initalizedLocalStore.updateOne(() => {
        shouldToast(silent) && toast.success(<Notification title="Note successfully updated!" />)
      })(n, silent)
    },
    deleteOneById: (id, silent) => {
      return initalizedLocalStore.deleteOneById()(id, silent)
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

  const getBlockById = (id: number): Promise<NoteBlock | undefined> => {
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
