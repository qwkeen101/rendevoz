import { CustomEditor, TableCellElement, TableElement } from '~/typings'
import { ReactEditor } from '@/core'

export default (e: PointerEvent, editor: CustomEditor, tableElement: TableElement, currCell: TableCellElement) => {
  const rowDOMs = tableElement.children.map(i => ReactEditor.toDOMNode(editor, i))
  const currRowIndex = tableElement.children.findIndex(i => i.children.includes(currCell))
  const currRow = tableElement.children[currRowIndex]
  if (!currRow) return
  const pointerX = e.clientX,
    pointerY = e.clientY
  console.log(rowDOMs)
  let idx = 0
  for (const rowDOM of rowDOMs) {
    const element = ReactEditor.toSlateNode(editor, rowDOM)
    if (element === currRow) {
      idx += 1
      continue
    }
    const bounding = rowDOM.getBoundingClientRect()
    if (
      (idx === 0 && pointerY <= bounding.top) ||
      (idx === rowDOMs.length - 1 && pointerY >= bounding.bottom) ||
      (pointerY >= bounding.top && pointerY <= bounding.bottom)
    ) {
      const rowIdx = tableElement.children.indexOf(element)
      if (rowIdx < currRowIndex) {
        return {
          direction: 'top',
          cells: element.children
        }
      }
      if (rowIdx > currRowIndex) {
        return {
          direction: 'bottom',
          cells: element.children
        }
      }
    }
    idx += 1
  }
}
