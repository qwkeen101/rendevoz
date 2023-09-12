import { Rendevoz } from '@/core/rendevoz'
import { BuiltInDraggableElement, CustomEditor, IEditorInstance } from '~/typings'
import { Editor, Transforms } from 'slate'
import { useEffect } from 'react'
import Id from '@/utils/id'

const useDragCreateSyncBlock = (instance: IEditorInstance, editor: CustomEditor) => {
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = Rendevoz.Events.Emit.useEventHandler('editor')
  handler.on('turnElementsToSyncBlock', async data => {
    const currentDraggingDetails = data.draggingDetails as BuiltInDraggableElement
    // transform elements to synced block
    if (currentDraggingDetails.type === 'noteBlock' && currentDraggingDetails.noteId === editor.noteId) {
      const elements = currentDraggingDetails.elements || [currentDraggingDetails.element]
      const start = elements[0]
      const end = elements[elements.length - 1]
      const startPath = instance.getElementPathById?.(start.id)
      const endPath = instance.getElementPathById?.(end.id)
      if (!startPath || !endPath) return
      const range = Editor.range(editor, startPath, endPath)
      const nodes = Editor.nodes(editor, { at: range })
      if (Array.from(nodes).some(i => i[0].type === 'synced')) return
      Transforms.removeNodes(editor, {
        at: range
      })
      Transforms.insertNodes(
        editor,
        {
          id: Id.getId(),
          type: 'synced',
          syncVersion: 0,
          originId: data.syncBlockMetaId,
          children: [{ text: '' }]
        },
        {
          at: startPath
        }
      )
    }
  })
  useEffect(() => {
    emitter.addListener('editor', handler)
    return () => {
      emitter.removeListener('editor', handler)
    }
  }, [])
}

export default useDragCreateSyncBlock
