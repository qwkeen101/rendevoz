import { CustomEditor, CustomElement } from '~/typings'
import { ReactEditor } from '@/core'

export default (
  e: PointerEvent,
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
      return 'left'
    }
    if (pX > bounding.right) {
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
