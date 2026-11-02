import { CustomEditor, TableElement } from '~/typings'
import produce from 'immer'
import { Transforms, Editor } from 'slate'
import { ReactEditor } from '@/core'
import normalizeTable from '../plugins/normalize/normalizeTable'

export default (
  currColumnName: string,
  targetColumnName: string,
  direction: 'right' | 'left',
  tableElement: TableElement,
  editor: CustomEditor
) => {
  const currentColumns = tableElement.columns
  if (!currentColumns.some(i => i.accessor === currColumnName) || !currentColumns.some(i => i.accessor === targetColumnName)) {
    return
  }
  const newColumns = produce(currentColumns, draft => {
    const currIdx = draft.findIndex(i => i.accessor === currColumnName)
    const curr = draft[currIdx]
    draft.splice(currIdx, 1)
    const targetIdx = draft.findIndex(i => i.accessor === targetColumnName)
    if (direction === 'right') {
      draft.splice(targetIdx + 1, 0, curr)
    } else {
      draft.splice(targetIdx, 0, curr)
    }
  })
  const path = ReactEditor.findPath(editor, tableElement)
  Editor.withoutNormalizing(editor, () => {
    Transforms.setNodes(
      editor,
      {
        columns: newColumns
      },
      {
        at: ReactEditor.findPath(editor, tableElement)
      }
    )
    normalizeTable(Editor.node(editor, path)[0], path, editor)
  })
}
