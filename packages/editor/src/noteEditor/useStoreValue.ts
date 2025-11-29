import { Descendant } from 'slate'
import { IEditorInstance, IGlobalEvents } from '~/typings'
import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useDebounceFn, useMemoizedFn } from '@/hooks'
import { NoteStore, ObjectStore } from '@/api/stores'
import { isEqual } from 'lodash'
import SyncAPI from '@/api/sync'

const useStoreValue = (options: {
  onContentLoaded?: VoidFunction
  noteId?: number
  defaultValue?: Descendant[]
  id: string
  instanceRef: RefObject<IEditorInstance | undefined>
  metaId?: number
}) => {
  const shouldSaveRef = useRef(!!options.defaultValue)
  const { noteId, instanceRef, defaultValue, onContentLoaded } = options
  const { saveNoteAsBuffer, getNoteValue, saveNoteAsSearch } = NoteStore
  const note = ObjectStore('note').useValue(noteId)
  const [fetchedValue, setFetchedValue] = useState<Descendant[]>()
  const saveValueToNote = async (value: Descendant[]) => {
    if (!noteId) return
    if (!shouldSaveRef.current) return
    if (note && note.contentId) {
      Global.emitEvent('editorValueSaved', {
        noteId
      })
      await saveNoteAsBuffer(value, note.contentId)
      saveNoteAsSearch(value, options.metaId)
      ObjectStore('note').updateOne({ id: noteId, lastSavedAt: Date.now() })
    }
  }
  const debounceSaveValue = useDebounceFn(
    () => {
      const instance = instanceRef.current
      if (!instance) return
      const value = instance?.getSlateEditor?.().children
      if (value) {
        saveValueToNote(value).then(() => {
          if (noteId) {
            SyncAPI.note.commit(noteId)
          }
        })
      }
    },
    { wait: 1000 }
  )
  const debounceChangeDefaultValue = useDebounceFn(
    () => {
      const currentValue = instanceRef.current?.getSlateEditor?.().children
      if (currentValue) {
        setFetchedValue(currentValue)
      }
    },
    { wait: 200 }
  )
  const handleOperationApplied = (e: IGlobalEvents['editorOperationApplied']) => {
    debounceChangeDefaultValue.run()
    if (e.noteId === noteId && e.id === options.id) {
      shouldSaveRef.current = true
      debounceSaveValue.run()
    }
  }
  const handleValueSaved = (data: IGlobalEvents['editorValueSaved']) => {
    if (data.noteId === noteId) {
      shouldSaveRef.current = false
    }
  }
  const handleRefreshFromValue = (data: IGlobalEvents['editorRefreshFromValue']) => {
    const instance = instanceRef.current
    if (noteId && instance && data.noteId.includes(noteId)) {
      fetchValue()
    }
  }

  const fetchValue = useMemoizedFn(async () => {
    if (note?.contentId) {
      const noteValue = await getNoteValue(note.contentId)
      if (noteValue) {
        setFetchedValue(noteValue)
        const instance = instanceRef.current
        const currentValue = instance?.getSlateEditor?.().children
        onContentLoaded?.()
        if (!isEqual(currentValue, fetchedValue)) {
          instance?.replaceChildren?.(noteValue)
        }
      }
    }
  })
  useMemo(() => {
    if (note?.contentId) {
      fetchValue()
    }
  }, [note?.contentId])

  useMemo(() => {
    const instance = instanceRef.current
    if (defaultValue && (noteId ? !note?.contentId : true)) {
      instance?.replaceChildren?.(defaultValue)
      saveNoteAsSearch(defaultValue, options.metaId)
    }
  }, [defaultValue, note?.contentId])
  useEffect(() => {
    Global.addEventListener('editorOperationApplied', handleOperationApplied)
    Global.addEventListener('editorValueSaved', handleValueSaved)
    Global.addEventListener('editorRefreshFromValue', handleRefreshFromValue)
    return () => {
      Global.removeEventListener('editorOperationApplied', handleOperationApplied)
      Global.removeEventListener('editorValueSaved', handleValueSaved)
      Global.removeEventListener('editorRefreshFromValue', handleRefreshFromValue)
    }
  })
  useEffect(() => {
    return () => {
      const instance = instanceRef.current
      const value = instance?.editor.children
      if (value) {
        saveValueToNote(value)
      }
    }
  }, [])

  return {
    saveValueToNote,
    fetchValue,
    fetchedValue
  }
}

export default useStoreValue
