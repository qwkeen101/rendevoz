import { IEditorInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { ID_TO_ELEMENTS_MAP, ReactEditor } from '@/core'

const useEditorSelectAllKey = (instance: IEditorInstance) => {
  const handleSelectAllKey = (e: KeyboardEvent) => {
    const editor = instance.getSlateEditor?.()
    if (isHotkey('mod+a', e)) {
      if (!editor) return
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
      editor?.children.forEach(i => {
        selected.set(i.id, {
          element: i
        })
      })
      window.getSelection()?.empty()
      ID_TO_ELEMENTS_MAP.get(editor)?.forEach(i => {
        i.selectBlock()
      })
    }
  }

  return handleSelectAllKey
}

export default useEditorSelectAllKey
