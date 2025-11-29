import { CustomEditor, TableCellElement } from '~/typings'
import { ReactEditor } from '@/core'
import { Editor } from 'slate'

export default (editor: CustomEditor, cell: TableCellElement) => {
  const cellPath = ReactEditor.findPath(editor, cell)
  const idx = cellPath[cellPath.length - 1]
  const table = Editor.above(editor, {
    at: cellPath,
    match: n => n.type === 'table',
    mode: 'all'
  })
  if (table) {
    return table[0].children.map((i, rowIdx) => ({
      element: i.children[idx],
      path: [...table[1], rowIdx, idx]
    }))
  }
}
