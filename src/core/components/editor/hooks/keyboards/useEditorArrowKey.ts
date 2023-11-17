import { IEditorInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { Editor, Path, Range, Transforms } from 'slate'

const useEditorArrowKey = (instance: IEditorInstance) => {
  const editor = instance.getSlateEditor?.()
  const handleArrowKey = (e: KeyboardEvent) => {
    if (!editor) return
    if (editor.selection && Range.isCollapsed(editor.selection)) {
      if (isHotkey('left', e)) {
        e.preventDefault()
        const selection = editor.selection
        if (!selection) return
        const path = selection.anchor.path
        let distance = 1
        const curr = Editor.above(editor)
        if (
          curr?.[0].type === 'link' &&
          (Editor.isStart(editor, selection.anchor, selection.anchor.path) ||
            Editor.isStart(
              editor,
              {
                path: selection.anchor.path,
                offset: selection.anchor.offset - 1
              },
              selection.anchor.path
            ))
        )
          distance = 2
        if (Path.hasPrevious(path) && Editor.isStart(editor, selection.anchor, selection.anchor.path)) {
          const prevNode = Editor.node(editor, Path.previous(path))[0]
          if (['emoji', 'link'].includes(prevNode.type) || Editor.isVoid(editor, prevNode)) {
            distance = 2
          }
        }

        Transforms.move(editor, {
          unit: 'offset',
          reverse: true,
          distance
        })
        return
      }
      if (isHotkey('right', e)) {
        e.preventDefault()
        const selection = editor.selection
        if (!selection) return
        const path = selection.anchor.path
        let distance = 1
        const curr = Editor.above(editor)
        if (curr?.[0].type === 'link') {
          if (
            Editor.isEnd(editor, selection.anchor, selection.anchor.path) ||
            Editor.isEnd(
              editor,
              {
                path: selection.anchor.path,
                offset: selection.anchor.offset + 1
              },
              selection.anchor.path
            )
          ) {
            distance = 2
          }
        }
        if (Editor.hasPath(editor, Path.next(path)) && Editor.isEnd(editor, selection.anchor, selection.anchor.path)) {
          const nextNode = Editor.node(editor, Path.next(path))[0]
          if (['emoji', 'link'].includes(nextNode.type) || Editor.isVoid(editor, nextNode)) {
            distance = 2
          }
        }
        Transforms.move(editor, { unit: 'offset', distance })
        return
      }
    }
  }
  return handleArrowKey
}

export default useEditorArrowKey
