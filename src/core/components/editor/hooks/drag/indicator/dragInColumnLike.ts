import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'
import { ReactEditor } from '@/core'
import dragInsideMetaGroup from '@/core/components/editor/hooks/drag/indicator/dragInsideMetaGroup'
import getDragResult from '@/core/components/editor/hooks/drag/indicator/getDragResult'
import dragInsideColumnList from '@/core/components/editor/hooks/drag/indicator/dragInsideColumnList'
import getDirection from '@/core/components/editor/hooks/drag/indicator/getDirection'

export default (
  e: PointerEvent,
  container: HTMLElement,
  args: {
    editor: CustomEditor
    instance: IEditorInstance
    onlyTB?: boolean
  }
): IEditorInstance['values']['indicator'] | undefined => {
  const { editor } = args
  let closestElement: CustomElement | undefined = undefined

  const allBlockDOMs = Array.from(container.children).filter(i => i.hasAttribute('data-type'))
  // reverse here
  allBlockDOMs.reverse()
  for (const dom of allBlockDOMs) {
    const bounding = dom.getBoundingClientRect()
    if (e.clientY >= bounding.top) {
      closestElement = ReactEditor.toSlateNode(editor, dom)
      break
    }
  }

  if (!closestElement) {
    const editorNodeBounding = ReactEditor.toDOMNode(editor, editor).getBoundingClientRect()
    if (e.clientY < editorNodeBounding.y) {
      const firstElement = editor.children[0] as CustomElement | undefined
      if (firstElement) {
        return getDragResult('top', firstElement.id, e, editor)
      }
      return
    }
    const lastVisibleElement = editor.children.findLast(i => !i.hide) as CustomElement | undefined
    try {
      if (lastVisibleElement) {
        const lastVisibleNodeBounding = ReactEditor.toDOMNode(editor, lastVisibleElement).getBoundingClientRect()
        if (e.clientY > lastVisibleNodeBounding.bottom) {
          return getDragResult('bottom', lastVisibleElement.id, e, editor)
        }
      }
    } catch (e) {
      console.error('Can not find last node when dragging!')
    }
  } else {
    if (closestElement.type === 'columnList') {
      return dragInsideColumnList(e, closestElement, { ...args, onlyTB: true })
    }
    if (closestElement.type === 'metaObject') {
      if (dragInsideMetaGroup(closestElement)) {
        return
      }
    }
    const direction = getDirection(e, closestElement, editor, args.onlyTB)
    console.log(direction, closestElement)
    if (direction) {
      return getDragResult(direction, closestElement, e, editor)
    }
  }
}
