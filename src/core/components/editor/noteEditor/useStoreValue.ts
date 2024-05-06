import { Descendant } from 'slate'
import { IEditorInstance, OperationAppliedEvent } from '~/typings'
import { RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useDebounceFn, useMemoizedFn } from '@/hooks'
import { NoteStore, ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { isEqual } from 'lodash'
import SyncAPI from '@/api/sync'

const useStoreValue = (options: {
  onContentLoaded?: VoidFunction
  noteId?: number
  defaultValue?: Descendant[]
  instanceRef: RefObject<IEditorInstance | undefined>
  metaId?: number
}) => {
  const shouldSaveRef = useRef(options.defaultValue)
  const { noteId, instanceRef, defaultValue, onContentLoaded } = options
  const { saveNoteAsBuffer, getNoteValue, saveNoteAsSearch } = NoteStore
  const note = ObjectStore('note').useValue(noteId)
  const [fetchedValue, setFetchedValue] = useState<Descendant[]>()
  const globalEmitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = Rendevoz.Events.Emit.useEventHandler('editor')
  const saveValueToNote = async (value: Descendant[]) => {
    if (!noteId) return
    if (!shouldSaveRef.current) return
    if (note && note.contentId) {
      globalEmitter.emit('editor', {
        type: 'valueSaved',
        data: {
          noteId
        }
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

  const handleOperationApplied = (e: OperationAppliedEvent) => {
    if (e.noteId === noteId) {
      console.log(e)
      shouldSaveRef.current = true
      debounceSaveValue.run()
    }
  }
  handler.on('valueSaved', data => {
    if (data.noteId === noteId) {
      shouldSaveRef.current = false
    }
  })
  handler.on('refreshFromValue', data => {
    const instance = instanceRef.current
    if (noteId && instance && data.noteId.includes(noteId)) {
      fetchValue()
    }
  })
  handler.on('operationApplied', handleOperationApplied)

  const fetchValue = useMemoizedFn(async () => {
    if (note?.contentId) {
      const noteValue = await getNoteValue(note.contentId)
      if (noteValue) {
        setFetchedValue(noteValue)
      }
    }
  })
  useMemo(() => {
    if (note?.contentId) {
      fetchValue()
    }
  }, [note?.contentId])
  useLayoutEffect(() => {
    const instance = instanceRef.current
    if (fetchedValue) {
      const currentValue = instance?.getSlateEditor?.().children
      if (!isEqual(currentValue, fetchedValue)) {
        instance?.replaceChildren?.(fetchedValue)
      }
      onContentLoaded?.()
    }
  }, [fetchedValue])
  useMemo(() => {
    const instance = instanceRef.current
    if (defaultValue && (noteId ? !note?.contentId : true)) {
      instance?.replaceChildren?.(defaultValue)
      saveNoteAsSearch(defaultValue, options.metaId)
    }
  }, [defaultValue, note?.contentId])
  useEffect(() => {
    globalEmitter.addListener('editor', handler)
    return () => {
      globalEmitter.removeListener('editor', handler)
      const instance = instanceRef.current
      const value = instance?.getSlateEditor?.().children
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
