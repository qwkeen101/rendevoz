import { CustomEditor, CustomElement } from '~/typings'
import { ReactEditor } from '@/core'
import { Editor, Path } from 'slate'

export default (
  direction: 'top' | 'left' | 'right' | 'bottom',
  element: CustomElement,
  e: PointerEvent | DragEvent,
  editor: CustomEditor
) => {
  const type = element.type
  const towardsElement = editor.currentEnterElement
  let path = editor.instance.getElementPathById?.(element.id)
  if (!path) return
  if (towardsElement?.type === 'metaObject' && towardsElement.cardType === 'embeded') {
    if (direction === 'left' || direction === 'right') {
      return
    }
  }
  if (element.type === 'metaObject' && element.cardType === 'embeded') {
    if (direction === 'left' || direction === 'right') {
      return
    }
  }
  let shouldNested = false
  if (direction === 'top') {
    if (Path.hasPrevious(path)) {
      path = Path.previous(path)
      direction = 'bottom'
      element = Editor.node(editor, path)[0]
    }
  }
  if (direction === 'bottom' && (type === 'list-item' || type === 'order-list-item')) {
    const targetBound = ReactEditor.toDOMNode(editor, element).getBoundingClientRect()
    const mousePos = {
      x: e.clientX,
      y: e.clientY
    }
    if (targetBound) {
      const { left } = targetBound
      if (mousePos.x - left > 24) {
        shouldNested = true
      }
    }
  }
  return {
    direction,
    id: element.id,
    element,
    isNested: shouldNested,
    path
  }
}
