import { Editor, Node, Range, Text, Transforms } from 'slate'
import { CustomEditor } from '../../../../../typings/editor/types'

interface ISelectionTransform {
  replaceSelectedText: (editor: CustomEditor, newText: string) => void
  replaceSelectedNode: (editor: CustomEditor, node: Node) => void
  getSelectedText: (editor: CustomEditor) => string | undefined
}

export const SelectionTransform: ISelectionTransform = {
  getSelectedText: editor => {
    const { selection } = editor
    if (selection && Range.isExpanded(selection)) {
      return Editor.string(editor, selection)
    }
  },
  replaceSelectedText: (editor, newText) => {},
  replaceSelectedNode: (editor, node) => {
    const { selection } = editor
    if (selection && Range.isExpanded(selection)) {
      const pointRef = Editor.pointRef(editor, selection.anchor)
      Transforms.splitNodes(editor, {
        match: Text.isText
      })
      Transforms.insertNodes(editor, node, {
        at: pointRef.unref()
      })
    }
  }
}
