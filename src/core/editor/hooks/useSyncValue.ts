import { Rendevoz } from '@/core/rendevoz'
import { useEventHandler } from '@/events'
import { useDebounceFn } from '@/hooks'
import { useEffect } from 'react'
import { Editor, Transforms } from 'slate'
import { CustomEditor } from '~/typings'
import { EDITOR_TO_CHANGED } from '@/core'

const useLocalSyncValue = (editor: CustomEditor) => {
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = useEventHandler('editor')
  const { id, noteId } = editor
  handler.on('operationApplied', data => {
    if (!noteId) return
    if (data.noteId === noteId && data.id !== id) {
      console.log(data)
      EDITOR_TO_CHANGED.set(editor, false)
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
