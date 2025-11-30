import { CustomEditor, IEditorInstance } from '~/typings'
import { ReactEditor } from '../slate-react'
import { Editor, Range } from 'slate'

export default function getEditorBlockHandle(e: PointerEvent, instance: IEditorInstance, editor: CustomEditor, container?: HTMLElement) {
  const closestBlock = instance.blockOps?.getClosestOutestBlock({ x: e.clientX, y: e.clientY }, container)
  if (closestBlock) {
    let node = ReactEditor.toDOMNode(editor, closestBlock)
    const windowPoint = {
      x: e.clientX,
      y: e.clientY
    }

    if (closestBlock.type === 'table') {
      node = node.querySelector('.selectable')
    }
    if (closestBlock.type === 'synced') {
      let isBlockFocused = false
      const blockPath = instance.getElementPathById?.(closestBlock.id)
      if (blockPath && editor.selection) {
        const range = Editor.range(editor, blockPath)
        if (range && Range.includes(range, Range.start(editor.selection)) && Range.includes(range, Range.end(editor.selection))) {
          isBlockFocused = true
        }
      }
      // sync block focused, select inside
      if (isBlockFocused) {
        return getEditorBlockHandle(e, instance, editor, node.firstElementChild)
      }
    }
    if (closestBlock.type === 'columnList') {
      const allColumns = node.querySelectorAll('[data-type="column"]')
      return Array.from(allColumns)
        .map(i => getEditorBlockHandle(e, instance, editor, i))
        .find(i => i)
    }
    if (closestBlock.type === 'metaObject' && closestBlock.cardType === 'embeded') {
      const groupHandle = node.querySelector('[role="group-action-container"]')
      console.log(groupHandle)
      if (groupHandle) {
        const groupHandleBounding = groupHandle.getBoundingClientRect()
        if (
          windowPoint.x >= groupHandleBounding.left - 70 &&
          windowPoint.x < groupHandleBounding.right &&
          windowPoint.y >= groupHandleBounding.top &&
          windowPoint.y <= groupHandleBounding.bottom
        ) {
          return {
            node: groupHandle,
            element: closestBlock
          }
        }
        return
      }
    }
    return {
      node,
      element: closestBlock
    }
  }
}
