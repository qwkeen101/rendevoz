/**
 * 1.如果不在有缩进的块中，添加双空格
 * 2.如果在有缩进的块中，如无序列表，增加缩进
 * 3.如果多选，则为所有有缩进的块添加缩进
 * 4.Shift+Tab做反动作
 */
import isHotkey from 'is-hotkey'
import { KEY } from '../consts'
import { Range, Transforms } from 'slate'
import { IEditorInstance } from '~/typings'
import { ReactEditor } from '@/core'

const useEditorTabKey = (instance: IEditorInstance) => {
  const editor = instance.getSlateEditor?.()
  const handleTabKey = (e: KeyboardEvent) => {
    if ((isHotkey(KEY.Tab, e) || isHotkey('shift+tab', e)) && editor) {
      const direction = isHotkey(KEY.Tab, e) ? true : false
      const selected = instance.values.selectedBlocks
      const blockOps = instance.blockOps
      if (!blockOps) return
      e.preventDefault()
      if (selected.size > 0) {
        ReactEditor.focus(editor)
        const indentableBlocks = Array.from(selected.values()).filter(i => instance.blockOps?.isIndentableBlock?.(i.element.type))
        indentableBlocks.forEach(i => {
          if (i.pathRef?.current) {
            const path = i.pathRef.current
            if (direction) {
              blockOps.insertBlockIndent?.(path)
            } else {
              blockOps.minusBlockIndent?.(path)
            }
          }
        })
      } else {
        const selection = editor.selection
        // indent or de indent current block
        if (selection && Range.isCollapsed(selection) && ReactEditor.isFocused(editor)) {
          const currentBlock = blockOps.getAboveBlock?.()
          if (currentBlock) {
            if (blockOps.isIndentableBlock?.(currentBlock[0].type)) {
              if (direction) {
                blockOps.insertBlockIndent?.(currentBlock[1])
              } else {
                blockOps.minusBlockIndent?.(currentBlock[1])
              }
            } else {
              Transforms.insertText(editor, '\u2003')
            }
          }
        }
      }
    }
  }
  return handleTabKey
}

export default useEditorTabKey
