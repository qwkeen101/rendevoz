import { CustomEditor } from '@/components/editor/types'
import useDb from '@/hooks/stores/useDb'
import useLatest from '@/hooks/utils/useLatest'
import { GlobalScope } from '@/jotai/jotaiScope'
import { bulkDeleteFromSearchDb, bulkImportIntoSearchDb, SearchableItem } from '@/utils/searchIndex'
import { atom, useAtom } from 'jotai'
import { useMemo } from 'react'
import { INote } from '~/typings/data'
import BaseStore from './base.store'

const notesAtom = atom(new Map<number, INote>())
const useNoteStore = () => {
  const [notes, setNotes] = useAtom(notesAtom, GlobalScope)
  const latestNotes = useLatest(notes)
  const { add, get, orderedData, update } = BaseStore

  const all = orderedData(notes).filter(i => !i.deleted)
  const noteDb = useDb('notes')
  const blockDb = useDb('blocks')
  const getAllNotes = () => {
    return noteDb.toArray().then(data => setNotes(new Map(data.map(i => [i.id, i]))))
  }
  const addNote = (note: INote) => {
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
    const importIntoSearch = bulkImportIntoSearchDb(searchItems)
    return Promise.all([saveBlocks, saveNoteItem, importIntoSearch])
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
  return useMemo(
    () => ({
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
      deleteNote
    }),
    [notes]
  )
}

export default useNoteStore
