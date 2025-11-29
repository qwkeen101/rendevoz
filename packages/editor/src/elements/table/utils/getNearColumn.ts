import { CustomEditor, TableCellElement, TableElement } from '~/typings'
import { ReactEditor } from '@/core'
import getColumnsCells from '../elements/table/utils/getColumnsCells'

export default (e: PointerEvent, editor: CustomEditor, tableElement: TableElement, currCell: TableCellElement) => {
  const firstRow = tableElement.children[0]
  if (firstRow) {
    const firstRowNode = ReactEditor.toDOMNode(editor, firstRow)
    const cellDOMS = firstRowNode.querySelectorAll('td')
    let idx = 0
    let currCellIdx: number | undefined = undefined
    let targetIdx: number | undefined = undefined
    for (const cell of cellDOMS) {
      const bounding = cell.getBoundingClientRect()
      const element = ReactEditor.toSlateNode(editor, cell)
      if (element === currCell) {
        currCellIdx = idx
      }
      if (
        (idx === 0 && e.clientX <= bounding.left) ||
        (idx === cellDOMS.length - 1 && e.clientX >= bounding.right) ||
        (e.clientX >= bounding.left && e.clientX <= bounding.right)
      ) {
        if (element !== currCell) {
          targetIdx = idx
        }
      }
      idx += 1
    }
    if (currCellIdx !== undefined && targetIdx !== undefined) {
      // drag right
      if (currCellIdx < targetIdx) {
        const cell = ReactEditor.toSlateNode(editor, cellDOMS[targetIdx])
        const cells = getColumnsCells(editor, cell)
        return {
          cells,
          direction: 'right'
        }
      }
      if (currCellIdx > targetIdx) {
        const cell = ReactEditor.toSlateNode(editor, cellDOMS[targetIdx])
        const cells = getColumnsCells(editor, cell)
        return {
          cells,
          direction: 'left'
        }
      }
    }
  }
}
