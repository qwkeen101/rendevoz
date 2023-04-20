import Id from '@/utils/id'
import { Editor, Range, Element as SlateElement, Transforms } from 'slate'
import SHORTCUTS from '../consts/shortcuts'
import { CustomEditor } from '~/typings'

function isNumeric(value: string) {
  return /^-?\d+$/.test(value)
}
const withShortcut = (editor: CustomEditor) => {
  const { insertText, handler } = editor
  editor.insertText = (text: string) => {
    const { selection } = editor
    if (text === ' ' && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n)
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const beforeText = Editor.string(editor, range)
      const type = SHORTCUTS[beforeText]
      if (beforeText.endsWith('.')) {
        const removeDotText = beforeText.replace('.', '')
        if (isNumeric(removeDotText)) {
          Transforms.select(editor, range)
          Transforms.delete(editor)
          const newProperties: Partial<SlateElement> = {
            type: 'order-list-item',
            id: Id.getId()
          }
          Transforms.setNodes<SlateElement>(editor, newProperties, {
            match: n => Editor.isBlock(editor, n)
          })
          const end = Editor.end(editor, path)
          setTimeout(() => {
            Transforms.select(editor, end)
          })
          return
        }
      }
      if (type) {
        if (type === 'meta-object') {
          handler?.({ type: 'addMetaObject' })
          insertText(text)
          return
        }
        Transforms.select(editor, range)
        Transforms.delete(editor)
        const newProperties: Partial<SlateElement> = {
          type
          // id: Id.getId()
        }
        Transforms.setNodes<SlateElement>(editor, newProperties, {
          match: n => Editor.isBlock(editor, n)
        })
        const end = Editor.end(editor, path)
        console.log(end)
        setTimeout(() => {
          Transforms.select(editor, end)
        })
        return
      }
    }
    insertText(text)
  }
  return editor
}

export default withShortcut
