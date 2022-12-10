import { EditorEventHandler } from '@/events/editorEvent'
import useEventEmitter from '@/events/useEventEmitter'
import { useDebounceFn } from '@/hooks'
import { YHistoryEditor, YjsEditor } from '@slate-yjs/core'
import { useEffect, useState } from 'react'
import { Transforms } from 'slate'
import { CustomEditor } from '../types'

const useLocalSyncValue = (editor: CustomEditor) => {
  const emitter = useEventEmitter()
  const handler = new EditorEventHandler()
  const { id, noteId } = editor
  handler.on('operationApplied', data => {
    if (data.noteId === noteId && data.id !== id) {
      const { operation } = data
      Transforms.transform(editor, operation)
      // YjsEditor.withOrigin(editor, YjsEditor.origin(editor), () => {
      //   Transforms.transform(editor, operation)
      // })
      debouncedChange()
    }
  })
  const changeEditor = () => {
    editor.onChange()
    // YjsEditor.flushLocalChanges(editor)
  }
  const { run: debouncedChange } = useDebounceFn(changeEditor, { wait: 15 })
  useEffect(() => {
    emitter.addListener('editor', handler)
    return () => {
      emitter.removeListener('editor', handler)
    }
  })
}

export default useLocalSyncValue
