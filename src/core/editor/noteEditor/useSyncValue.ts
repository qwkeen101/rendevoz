import { IEditorInstance } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import { useEffect } from 'react'

// sync note value between different notes
const useSyncValue = (editorId: string, noteId?: number, instance?: IEditorInstance) => {
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = Rendevoz.Events.Emit.useEventHandler('editor')
  handler.on('operationApplied', data => {
    if (!noteId) return
    if (!instance) return
    if (data.noteId === noteId && data.id !== editorId) {
      const { operation } = data
      instance.applyOperation?.(operation, true)
    }
  })
  useEffect(() => {
    emitter.addListener('editor', handler)
    return () => {
      emitter.removeListener('editor', handler)
    }
  })
}

export default useSyncValue
