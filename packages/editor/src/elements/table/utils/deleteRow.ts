import { CustomEditor, TableCellElement, TableElement } from '~/typings'
import { ReactEditor } from '@/core'
import { Transforms } from 'slate'

export default (cell: TableCellElement, table: TableElement, editor: CustomEditor) => {
  const rowIndex = table.children.findIndex(i => i.children.includes(cell))
  if (rowIndex >= 0) {
    const tablePath = ReactEditor.findPath(editor, table)
    Transforms.removeNodes(editor, {
      at: [...tablePath, rowIndex]
    })
  }
}
