import { IEditorInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { ReactEditor } from '@/core'
import { Node } from 'slate'
import { useSelectAtomValue } from '@/hooks'
import { EditorStateAtom } from '../hooks/useEditorState'

const useEditorSelectAllKey = (instance: IEditorInstance) => {
  const textbox = useSelectAtomValue(EditorStateAtom, s => s.textboxMode)
  return (e: KeyboardEvent) => {
    const editor = instance.editor
    if (isHotkey('mod+a', e)) {
      if (textbox) {
        const node = ReactEditor.toDOMNode(editor, editor)
        window.getSelection()?.selectAllChildren(node)
        instance.values.selectingAll = true
        return
      }
      const selected = instance.values.selectedBlocks
      const currentSelection = window.getSelection()?.toString()
      if (!currentSelection && !selected.size) {
        const currentBlock = instance.blockOps?.getAboveBlock?.()
        if (currentBlock) {
          e.preventDefault()
          const node = ReactEditor.toDOMNode(editor, currentBlock[0])
          window.getSelection()?.selectAllChildren(node)
          return
        }
      }
      instance.values.selectingAll = true
      e.preventDefault()
      window.getSelection()?.empty()
      Node.elements(editor).forEach(i => {
        instance.selectOps?.selectBlock(i[0].id)
      })
    }
  }
}

export default useEditorSelectAllKey
