import dragInColumnLike from '../hooks/drag/indicator/dragInColumnLike'
import getDragResult from '../hooks/drag/indicator/getDragResult'
import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'
import { ReactEditor } from '@/core'

export default (
  e: PointerEvent,
  element: CustomElement,
  args: {
    editor: CustomEditor
    instance: IEditorInstance
    onlyTB?: boolean
  }
) => {
  const columnDOMs = ReactEditor.toDOMNode(args.editor, element)
    ?.querySelectorAll(`[data-spec-type="column"]`)
  console.log(columnDOMs)
  if (columnDOMs) {
    const pointerX = e.clientX
    let targetColumn: HTMLElement | undefined = undefined
    let direction: 'left' | 'right' | undefined = undefined
    for (const column of columnDOMs) {
      const bounding = column.getBoundingClientRect()
      if (pointerX < bounding.left) {
        targetColumn = column
        direction = 'left'
        break
      }
      if (pointerX >= bounding.left && pointerX <= bounding.right) {
        return dragInColumnLike(e, column, args)
      }
    }
    if (!targetColumn && !direction) {
      const lastColumn = Array.from(columnDOMs).pop()
      const lastColumnBounding = lastColumn?.getBoundingClientRect()
      if (lastColumn && lastColumnBounding && pointerX > lastColumnBounding.right) {
        targetColumn = lastColumn
        direction = 'right'
      }
    }
    if (targetColumn && direction) {
      const columnElement = ReactEditor.toSlateNode(args.editor, targetColumn)
      return getDragResult(direction, columnElement, e, args.editor)
    }
    return undefined
  }
}
