import { useEventHandler, useGlobalEventEmitter } from '@/events'
import { useDebounceFn } from '@/hooks'
import { useEffect } from 'react'
import { Transforms } from 'slate'
import { CustomEditor } from '~/typings'

const useLocalSyncValue = (editor: CustomEditor) => {
  const emitter = useGlobalEventEmitter()
  const handler = useEventHandler('editor')
  const { id, noteId } = editor
  handler.on('operationApplied', data => {
    console.log(data)
    if (data.noteId === noteId && data.id !== id) {
      console.log(data)
      const { operation } = data
      Transforms.transform(editor, operation)
      editor.operations.push(operation)
      debouncedChange()
    }
  })
  const changeEditor = () => {
    editor.onChange()
    editor.operations = []
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
