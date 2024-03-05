import { CustomEditor, TableCellElement, TableRowElement } from '~/typings'
import { ReactEditor } from '@/core'
import { Editor, Path } from 'slate'

export default (editor: CustomEditor, cell: TableCellElement) => {
  const cellPath = ReactEditor.findPath(editor, cell)
  const rowPath = Path.parent(cellPath)
  const row = Editor.node(editor, rowPath)[0] as TableRowElement
  return row.children.map((i, idx) => ({
    element: i,
    path: [...rowPath, idx]
  }))
}
