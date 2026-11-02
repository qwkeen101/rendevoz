import { IEditorInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { Editor, Path, Range, Transforms } from 'slate'
import { KEY } from '../consts'
import { ReactEditor } from '@/core'

const useEditorArrowKey = (instance: IEditorInstance) => {
  const editor = instance.editor
  return (e: KeyboardEvent) => {
    if (editor.selection && Range.isCollapsed(editor.selection) && ReactEditor.isFocused(editor)) {
      if (isHotkey(KEY.ArrowLeft, e)) {
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
          if (Editor.isElementReadOnly(editor, prevNode)) {
            distance = 2
          }
        }
        if (distance > 1) {
          console.log('prevented')
          e.preventDefault()
          Transforms.move(editor, {
            unit: 'offset',
            reverse: true,
            distance
          })
        }

        return
      }
      if (isHotkey(KEY.ArrowRight, e)) {
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
          if (Editor.isElementReadOnly(editor, nextNode)) {
            distance = 2
          }
        }
        console.log(distance)
        if (distance > 1) {
          e.preventDefault()
          Transforms.move(editor, { unit: 'offset', distance })
        }

        return
      }
    }
  }
}

export default useEditorArrowKey
