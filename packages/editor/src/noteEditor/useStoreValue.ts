import { Descendant } from 'slate'
import { IEditorInstance, IGlobalEvents } from '~/typings'
import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useDebounceFn, useMemoizedFn } from '@/hooks'
import { isEqual } from 'lodash'

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
  const note = undefined
  const [fetchedValue, setFetchedValue] = useState<Descendant[]>()
  const saveValueToNote = async (value: Descendant[]) => {
    if (!noteId) return
    if (!shouldSaveRef.current) return
    return
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
    if (noteId && instance && data.noteId?.includes?.(noteId)) {
      fetchValue()
    }
  }

  const fetchValue = useMemoizedFn(async () => {
    return
  })
  useMemo(() => {
    fetchValue()
  }, [])

  useMemo(() => {
    const instance = instanceRef.current
    if (defaultValue) {
      instance?.replaceChildren?.(defaultValue)
    }
  }, [defaultValue])
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
