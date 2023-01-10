import { CustomEditor } from '@/components/editor/types'
import useDb from '@/hooks/stores/useDb'
import useLatest from '@/hooks/utils/useLatest'
import { GlobalScope } from '@/jotai/jotaiScope'
import Id from '@/utils/id'
import { bulkDeleteFromSearchDb, SearchableItem } from '@/utils/searchIndex'
import { atom, useAtom } from 'jotai'
import { useMemo } from 'react'
import { Descendant } from 'slate'
import { INote } from '~/typings/data'
import BaseStore from './base.store'
import { IStore } from './store.type'

const { orderedData } = BaseStore

export const notesAtom = atom(new Map<number, INote>())

export const allNotesAtom = atom(get => orderedData(get(notesAtom)))

const undeletedNotesAtom = atom(get => get(allNotesAtom).filter(i => !i.deleted))

export const pinnedNotesAtom = atom(get => get(undeletedNotesAtom).filter(i => i.pinned))

const useNoteStore = () => {
  const [notes, setNotes] = useAtom(notesAtom, GlobalScope)
  const latestNotes = useLatest(notes)
  const { add, get, orderedData, update } = BaseStore

  const all = orderedData(notes).filter(i => !i.deleted)
  const noteDb = useDb('notes')
  const blockDb = useDb('blocks')
  const blobDb = useDb('blobs')
  const store: IStore<INote> = {
    getAll: () => {
      return noteDb.toArray().then(data => {
        if (data) {
          setNotes(new Map(data.map(i => [i.id, i])))
          return true
        } else {
          return false
        }
      })
    },
    getOneById: id => {
      const note = get(id, notes)
      if (note) return Promise.resolve(note)
      return new Promise(res => {
        noteDb.get(id).then(note => {
          if (note) {
            setNotes(add(note, notes))
            res(note)
          } else {
            res(undefined)
          }
        })
      })
    },
    fetchOneById: id => store.getOneById(id),
    addOne: n => {
      const newNote: INote = {
        ...n,
        id: Id.getId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: n.title || 'Untitled'
      }
      setNotes(add(newNote, notes))
      return noteDb.put(newNote).then(() => newNote)
    },
    updateOne: n => {
      return store.getOneById(n.id).then(obj => {
        if (obj) {
          const newObj = {
            ...obj,
            ...n
          }
          setNotes(update(newObj, notes))
          noteDb.put(newObj)
          return Promise.resolve(newObj)
        }
        return Promise.resolve(undefined)
      })
    },
    deleteOneById: id => {
      return store.updateOne({ id, deleted: true }).then(data => (data ? true : false))
    }
  }
  const getAllNotes = () => {
    return noteDb.toArray().then(data => setNotes(new Map(data.map(i => [i.id, i]))))
  }
  const addNote = (note: Partial<INote>) => {
    const newNote: INote = {
      ...note,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    setNotes(add(newNote, notes))
    return noteDb.put(newNote)
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
  const updateNote = (note: Partial<INote>) => {
    return getNoteById(note.id)
      .then(n => ({
        ...n,
        ...note,
        updatedAt: Date.now()
      }))
      .then(n => {
        setNotes(update(n, notes))
        noteDb.put(n)
      })
  }
  const getNoteById = (noteId: number): Promise<INote | undefined> => {
    const notes = latestNotes.current
    const note = get(noteId, notes)
    if (note) {
      return Promise.resolve(note)
    }
    return new Promise((resolve, reject) => {
      noteDb.get(noteId).then(note => {
        if (note) {
          setNotes(add(note, notes))
          resolve(note)
        } else {
          resolve(undefined)
        }
      })
    })
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
  const findSubNotes = (rootNoteId: number): Promise<INote[]> => {
    return new Promise(resolve => resolve(all.filter(i => i.parentNoteId === rootNoteId)))
  }
  const saveNoteAndBlocks = (editor: CustomEditor, blocks: []) => {
    if (!blocks[0]) return
    const saveNoteItem = noteDb
      .get(blocks[0].noteId)
      .then((note: INote) => {
        note.subBlockIds = editor.children.map(i => i.id)
        const newBlockIds = blocks.map(i => i.id)
        const deletedBlockIds = note.allBlockIds.filter(i => !newBlockIds.includes(i))
        note.allBlockIds = newBlockIds
        note.updatedAt = Date.now()
        blockDb.bulkDelete(deletedBlockIds)
        bulkDeleteFromSearchDb(deletedBlockIds)
        return note
      })
      .then(note => noteDb.put(note))
    const saveBlocks = blockDb.bulkPut(blocks)
    const searchItems: SearchableItem[] = blocks.map(i => ({
      itemId: i.id,
      itemType: 'block',
      fields: {
        plainText: i.plain
      }
    }))
    // const importIntoSearch = bulkImportIntoSearchDb(searchItems)
    return Promise.all([saveBlocks, saveNoteItem])
  }
  const getNoteAndBlocks = (noteId: number) => {
    return noteDb.get(noteId).then(note => {
      return Promise.all([note, blockDb.bulkGet(note?.allBlockIds || [])])
    })
  }
  const renameNote = (noteId: number, newName: string) => {
    const targetNote = get(noteId, notes)
    if (targetNote) {
      const newNote = { ...targetNote, title: newName }
      setNotes(update(newNote, notes))
      noteDb.put(newNote)
    }
  }
  const deleteNote = (noteId: number) => {
    getNoteById(noteId).then(note => {
      updateNote({
        ...note,
        deleted: true
      })
    })
  }
  const saveNoteAsBuffer = (value: Descendant[], id?: number) => {
    const realId = id || Id.getId()
    console.log(realId)
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
      ...store,
      all,
      getAllNotes,
      updateNote,
      findParentNotes,
      findSubNotes,
      addNote,
      saveNote,
      getNoteById,
      getNotesByIds,
      saveNoteAndBlocks,
      getNoteAndBlocks,
      renameNote,
      deleteNote,
      saveNoteAsBuffer,
      getNoteValue
    }),
    [notes]
  )
}

export default useNoteStore
