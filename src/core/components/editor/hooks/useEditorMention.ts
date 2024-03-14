import { CustomEditor } from '~/typings'
import { Editor, Range, Transforms } from 'slate'
import Id from '@/utils/id'
import { HistoryEditor } from 'slate-history'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { waitFor } from '@/utils'

const useEditorMention = (editor: CustomEditor) => {
  const instance = useEditorInstance()
  const openForm = (id: number) => {
    waitFor(
      () => !!instance.blockOps?.getBlockFuncs(id)?.openPickMeta,
      () => {
        instance.blockOps?.getBlockFuncs(id)?.openPickMeta?.()
      }
    )
  }
  const handleMentionKey = (e: KeyboardEvent) => {
    const curr = Editor.above(editor)
    if (!curr) return
    if (curr[0].type === 'inline-metapicker') return
    if (e.key === '@') {
      e.preventDefault()
      HistoryEditor.withoutSaving(editor, () => {
        const id = Id.getId()
        Transforms.insertNodes(editor, {
          type: 'inline-metapicker',
          children: [{ text: '' }],
          id,
          isAt: true
        })
        openForm(id)
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
          const id = Id.getId()
          Editor.deleteBackward(editor, { unit: 'character' })
          Transforms.insertNodes(editor, {
            type: 'inline-metapicker',
            children: [{ text: '' }],
            isAt: false,
            id
          })
          openForm(id)
        }
      }
    }
  }
  return {
    handleMentionKey
  }
}

export default useEditorMention
