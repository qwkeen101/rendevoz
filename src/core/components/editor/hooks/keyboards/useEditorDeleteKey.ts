import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { Transforms } from 'slate'
import { IEditorInstance } from '~/typings'

/**
 * 如果有多选，就把多选的块删除，不然正常删除
 */
const useEditorDeleteKey = (instance: IEditorInstance) => {
  const deleteKeyHandler = (e: KeyboardEvent) => {
    const editor = instance.getSlateEditor?.()
    if (!editor) return
    if (isHotkey(KEY.Delete, e) || isHotkey(KEY.Backspace, e)) {
      const overlayOpen = editor.overlayManager?.isOpen?.()
      if (overlayOpen) {
        const beforeText = instance.textOps?.getBeforeText(1)
        if (beforeText === '/') {
          e.preventDefault()
          // delete /
          Transforms.delete(editor, { distance: 1, reverse: true })
          editor.overlayManager?.close()
        }
      }
    }
  }
  return deleteKeyHandler
}

export default useEditorDeleteKey
