import { Rendevoz } from '@/core/rendevoz'
import { BuiltInDraggableElement, CustomEditor, IEditorInstance } from '~/typings'
import { Editor, Path, Transforms } from 'slate'
import { useEffect } from 'react'
import Id from '@/utils/id'

const useDragCreateSyncBlock = (instance: IEditorInstance, editor: CustomEditor) => {
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = Rendevoz.Events.Emit.useEventHandler('editor')
  handler.on('turnElementsToSyncBlock', async data => {
    const currentDraggingDetails = data.draggingDetails as BuiltInDraggableElement
    // transform elements to synced block
    console.log(currentDraggingDetails)
    if (currentDraggingDetails.type === 'noteBlock' && currentDraggingDetails.editorId === editor.id) {
      const elements = currentDraggingDetails.elements || [currentDraggingDetails.element]
      const start = elements[0]
      const end = elements[elements.length - 1]
      let startPath = instance.getElementPathById?.(start.id)
      let endPath = instance.getElementPathById?.(end.id)
      if (!startPath || !endPath) return
      const shouldReverse = Path.isBefore(endPath, startPath)
      const range = Editor.range(editor, shouldReverse ? endPath : startPath, shouldReverse ? startPath : endPath)
      const nodes = Editor.nodes(editor, { at: range })
      if (Array.from(nodes).some(i => i[0].type === 'synced')) return
      Transforms.removeNodes(editor, {
        at: range,
        voids: true,
        hanging: true
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
          at: shouldReverse ? endPath : startPath
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
