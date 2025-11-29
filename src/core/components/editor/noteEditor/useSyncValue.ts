import { IEditorInstance, IGlobalEvents } from '~/typings'
import { RefObject, useEffect } from 'react'

// sync note value between different notes
const useSyncValue = (editorId: string, noteId?: number, instanceRef?: RefObject<IEditorInstance | undefined>) => {
  const handleOperationApplied = (data: IGlobalEvents['editorOperationApplied']) => {
    const instance = instanceRef?.current
    if (!noteId) return
    if (!instance) return
    if (data.noteId === noteId && data.id !== editorId) {
      const { operation } = data
      instance.applyOperation?.(operation, true)
    }
  }
  useEffect(() => {
    Global.addEventListener('editorOperationApplied', handleOperationApplied)
    return () => {
      Global.removeEventListener('editorOperationApplied', handleOperationApplied)
    }
  })
}

export default useSyncValue
