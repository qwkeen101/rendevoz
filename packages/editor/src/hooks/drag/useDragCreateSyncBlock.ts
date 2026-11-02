import { BuiltInDraggableElement, CustomEditor, IEditorInstance, IGlobalEvents } from '~/typings'
import { Editor, Path, Transforms } from 'slate'
import { useEffect } from 'react'
import Id from './utils/id'

const useDragCreateSyncBlock = (instance: IEditorInstance, editor: CustomEditor) => {
  const handle = (data: IGlobalEvents['editorTurnElementsToSync']) => {
    const currentDraggingDetails = data.draggingDetails as BuiltInDraggableElement
    // transform elements to synced block
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
  }
  useEffect(() => {
    Global.addEventListener('editorTurnElementsToSync', handle)
    return () => {
      Global.removeEventListener('editorTurnElementsToSync', handle)
    }
  })
}

export default useDragCreateSyncBlock
