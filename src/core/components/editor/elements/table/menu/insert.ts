import { CustomEditor, TableCellElement, TableElement } from '~/typings'
import Id from '@/utils/id'
import { Transforms } from 'slate'
import { ReactEditor } from '@/core'

export default (
  type: 'row' | 'column',
  direction: 'top' | 'left' | 'bottom' | 'right',
  cell: TableCellElement,
  table: TableElement,
  editor: CustomEditor
) => {
  if (type === 'row') {
    const columns = table.columns
    const newRow = {
      type: 'tableRow',
      id: Id.getId(),
      children: columns.map(i => ({
        type: 'tableCell',
        id: Id.getId(),
        colName: i.accessor,
        children: [
          {
            type: 'paragraph',
            children: [{ text: '' }],
            id: Id.getId()
          }
        ]
      }))
    }
    const rowIdx = table.children.findIndex(i => i.children.includes(cell))
    if (rowIdx >= 0) {
      const tablePath = ReactEditor.findPath(editor, table)
      Transforms.insertNodes(editor, newRow, {
        at: [...tablePath, direction === 'top' ? rowIdx : rowIdx + 1]
      })
    }
  }
  if (type === 'column') {
    const newColName = Id.getStrId()
    const tablePath = ReactEditor.findPath(editor, table)
    const currColumnIndex = table.columns.findIndex(i => i.accessor === cell.colName)
    if (currColumnIndex >= 0) {
      const targetIdx = direction === 'left' ? currColumnIndex : currColumnIndex + 1
      const newColumns = [...table.columns]
      newColumns.splice(targetIdx, 0, {
        accessor: newColName,
        width: 150
      })
      Transforms.setNodes(
        editor,
        {
          columns: [...newColumns]
        },
        {
          at: tablePath
        }
      )
      table.children.forEach((i, idx) => {
        Transforms.insertNodes(
          editor,
          {
            id: Id.getId(),
            type: 'tableCell',
            colName: newColName,
            children: [{ type: 'paragraph', id: Id.getId(), children: [{ text: '' }] }]
          },
          {
            at: [...tablePath, idx, targetIdx]
          }
        )
      })
    }
  }
}
