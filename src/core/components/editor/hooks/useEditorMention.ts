import isHotkey from 'is-hotkey'
import { CustomEditor } from '~/typings'
import getCursorPosition from '@/core/components/editor/utils/getCursorPosition'
import { Editor, Range, Text, Transforms } from 'slate'
import Id from '@/utils/id'

const useEditorMention = (editor: CustomEditor) => {
  const handleMentionKey = (e: KeyboardEvent) => {
    const curr = Editor.above(editor)
    if (!curr) return
    if (curr[0].type === 'inline-metapicker') return
    if (e.key === '@') {
      e.preventDefault()
      Transforms.insertNodes(editor, {
        type: 'inline-metapicker',
        children: [{ text: '' }],
        id: Id.getId(),
        isAt: true
      })
    }
    if (e.key === '[' && editor.selection && Range.isCollapsed(editor.selection)) {
      const prev = Editor.before(editor, editor.selection, {
        unit: 'character',
        distance: 1
      })

      if (prev) {
        const prevChar = Editor.string(editor, { anchor: prev, focus: editor.selection.focus })
        console.log(prevChar)
        if (prevChar === '[') {
          e.preventDefault()
          Editor.deleteBackward(editor, { unit: 'character' })
          Transforms.insertNodes(editor, {
            type: 'inline-metapicker',
            children: [{ text: '' }],
            isAt: false,
            id: Id.getId()
          })
        }
      }
      // console.log(prev)
    }
  }
  return {
    handleMentionKey
  }
}

export default useEditorMention
