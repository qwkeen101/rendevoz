import { CustomEditor, TableElement, TableRowElement } from '~/typings'
import produce from 'immer'
import { ReactEditor } from '@/core'
import { Transforms } from 'slate'

export default (
  currRow: TableRowElement,
  targetRow: TableRowElement,
  direction: 'top' | 'bottom',
  tableElement: TableElement,
  editor: CustomEditor
) => {
  const tablePath = ReactEditor.findPath(editor, tableElement)
  const currIdx = tableElement.children.indexOf(currRow)
  const targetIdx = tableElement.children.indexOf(targetRow)
  Transforms.moveNodes(editor, {
    at: [...tablePath, currIdx],
    to: [...tablePath, targetIdx]
  })
}
