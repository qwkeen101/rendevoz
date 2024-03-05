import { CustomEditor, TableCellElement } from '~/typings'
import getRowCells from '@/core/components/editor/elements/table/utils/getRowCells'
import getColumnsCells from '@/core/components/editor/elements/table/utils/getColumnsCells'
import { Editor, Transforms } from 'slate'
import Id from '@/utils/id'

export default (cell: TableCellElement, type: 'row' | 'column', editor: CustomEditor) => {
  if (type === 'row') {
    const sameRowCells = getRowCells(editor, cell)
    if (sameRowCells) {
      sameRowCells.forEach(i => {
        Transforms.removeNodes(editor, {
          at: Editor.range(editor, [...i.path, 0], [...i.path, i.element.children.length - 1])
        })
        Transforms.insertNodes(editor, { type: 'paragraph', id: Id.getId(), children: [{ text: '' }] }, { at: [...i.path, 0] })
      })
    }
  }
  if (type === 'column') {
    const sameColumnCells = getColumnsCells(editor, cell)
    if (sameColumnCells) {
      sameColumnCells.forEach(i => {
        console.log(i)
        Transforms.removeNodes(editor, {
          at: Editor.range(editor, [...i.path, 0], [...i.path, i.element.children.length - 1])
        })
        Transforms.insertNodes(editor, { type: 'paragraph', id: Id.getId(), children: [{ text: '' }] }, { at: [...i.path, 0] })
      })
    }
  }
}
