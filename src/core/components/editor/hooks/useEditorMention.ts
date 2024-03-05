import { CustomEditor } from '~/typings'
import { Editor, Range, Transforms } from 'slate'
import Id from '@/utils/id'
import { HistoryEditor } from 'slate-history'

const useEditorMention = (editor: CustomEditor) => {
  const handleMentionKey = (e: KeyboardEvent) => {
    const curr = Editor.above(editor)
    if (!curr) return
    if (curr[0].type === 'inline-metapicker') return
    if (e.key === '@') {
      e.preventDefault()
      HistoryEditor.withoutSaving(editor, () => {
        Transforms.insertNodes(editor, {
          type: 'inline-metapicker',
          children: [{ text: '' }],
          id: Id.getId(),
          isAt: true
        })
      })
    }
    if (e.key === '[' && editor.selection && Range.isCollapsed(editor.selection)) {
      const prev = Editor.before(editor, editor.selection, {
        unit: 'character',
        distance: 1
      })

      if (prev) {
        const prevChar = Editor.string(editor, { anchor: prev, focus: editor.selection.focus })
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
    }
  }
  return {
    handleMentionKey
  }
}

export default useEditorMention
