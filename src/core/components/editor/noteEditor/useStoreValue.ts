import { Descendant } from 'slate'
import { IEditorInstance, OperationAppliedEvent } from '~/typings'
import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDebounceFn, useMemoizedFn } from '@/hooks'
import { NoteStore, ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { isEqual } from 'lodash'

const useStoreValue = (options: {
  onContentLoaded?: VoidFunction
  noteId?: number
  defaultValue?: Descendant[]
  instanceRef: RefObject<IEditorInstance | undefined>
}) => {
  const shouldSaveRef = useRef(false)
  const { noteId, instanceRef, defaultValue, onContentLoaded } = options
  const { saveNoteAsBuffer, getNoteValue, saveNoteAsSearch } = NoteStore
  const note = ObjectStore('note').useValue(noteId)
  const [fetchedValue, setFetchedValue] = useState<Descendant[]>()
  const globalEmitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = Rendevoz.Events.Emit.useEventHandler('editor')
  const saveValueToNote = (value: Descendant[]) => {
    if (!noteId) return
    if (!shouldSaveRef.current) return
    if (note && note.contentId) {
      globalEmitter.emit('editor', {
        type: 'valueSaved',
        data: {
          noteId
        }
      })
      saveNoteAsBuffer(value, note.contentId)
      saveNoteAsSearch(value, noteId)
      ObjectStore('note').updateOne({ id: noteId, lastSavedAt: Date.now() })
    }
  }
  const debounceSaveValue = useDebounceFn(
    () => {
      const instance = instanceRef.current
      if (!instance) return
      const value = instance?.getSlateEditor?.().children
      if (value) {
        saveValueToNote(value)
      }
    },
    { wait: 1000 }
  )

  const handleOperationApplied = (e: OperationAppliedEvent) => {
    if (e.noteId === noteId) {
      shouldSaveRef.current = true
      debounceSaveValue.run()
    }
  }
  handler.on('valueSaved', data => {
    if (data.noteId === noteId) {
      shouldSaveRef.current = false
    }
  })
  handler.on('operationApplied', handleOperationApplied)

  const fetchValue = useMemoizedFn(async () => {
    if (note?.contentId) {
      const noteValue = await getNoteValue(note.contentId)
      if (noteValue) {
        onContentLoaded?.()
        setFetchedValue(noteValue)
      }
    }
  })
  useLayoutEffect(() => {
    if (note?.contentId) {
      fetchValue()
    }
  }, [note?.contentId])
  useLayoutEffect(() => {
    const instance = instanceRef.current
    if (instance && fetchedValue) {
      const currentValue = instance?.getSlateEditor?.().children
      if (!isEqual(currentValue, fetchedValue)) {
        instance?.replaceChildren?.(fetchedValue)
      }
    }
  }, [fetchedValue])
  useEffect(() => {
    const instance = instanceRef.current
    if (defaultValue && !note?.contentId) {
      instance?.replaceChildren?.(defaultValue)
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
