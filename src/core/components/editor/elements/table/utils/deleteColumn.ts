import { CustomEditor, TableCellElement, TableElement } from '~/typings'
import getColumnsCells from '@/core/components/editor/elements/table/utils/getColumnsCells'
import { Transforms } from 'slate'
import { ReactEditor } from '@/core'

export default (cell: TableCellElement, table: TableElement, editor: CustomEditor) => {
  const sameColumnCells = getColumnsCells(editor, cell)
  if (sameColumnCells) {
    const colName = cell.colName
    const tablePath = ReactEditor.findPath(editor, table)
    Transforms.setNodes(
      editor,
      {
        columns: table.columns.filter(i => i.accessor !== colName)
      },
      {
        at: tablePath
      }
    )
    sameColumnCells.forEach(c => {
      Transforms.removeNodes(editor, {
        at: c.path
      })
    })
  }
}
