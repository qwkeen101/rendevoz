import { CustomEditor, CustomElement } from '~/typings'
import { ReactEditor } from '@/core'

export default (
  e: PointerEvent | DragEvent,
  element: CustomElement,
  editor: CustomEditor,
  onlyTB?: boolean
): 'top' | 'left' | 'right' | 'bottom' | undefined => {
  const elementDOM = ReactEditor.toDOMNode(editor, element)
  const selectable = elementDOM.classList.contains('selectable') ? elementDOM : elementDOM.querySelector('.selectable')
  if (!selectable) return
  const bounding = selectable.getBoundingClientRect()
  const pX = e.clientX,
    pY = e.clientY
  const draggingElement = Global.values.draggingDetails
  if (!draggingElement && !(e && e instanceof DragEvent)) return undefined
  if (draggingElement?.type === 'noteBlock' && draggingElement.elements?.some(i => i.id === element.id)) {
    return
  }
  if (onlyTB) {
    if (pY >= bounding.top && pY - bounding.top < bounding.height / 2) {
      return 'top'
    }
    if (pY >= bounding.top && pY - bounding.top >= bounding.height / 2) {
      return 'bottom'
    }
    return undefined
  } else {
    if (pX < bounding.left) {
      if (
        draggingElement?.type === 'noteBlock' &&
        (draggingElement.element?.id === element.id || draggingElement.elements?.some(i => i.id === element.id))
      ) {
        return
      }
      return 'left'
    }
    if (pX > bounding.right) {
      if (
        draggingElement?.type === 'noteBlock' &&
        (draggingElement.element?.id === element.id || draggingElement.elements?.some(i => i.id === element.id))
      ) {
        return
      }
      return 'right'
    }
    if (pY >= bounding.top && pY - bounding.top < bounding.height / 2) {
      return 'top'
    }
    if (pY >= bounding.top && pY - bounding.top >= bounding.height / 2) {
      return 'bottom'
    }
    return undefined
  }
}
