import { CustomEditor, TableCellElement } from '~/typings'
import { Editor, Element, Node, Path, PathRef, Text, Transforms } from 'slate'
import Id from './utils/id'

export default (n: TableCellElement, path: Path, editor: CustomEditor) => {
  const children = n.children
  const deletedPaths: PathRef[] = []
  children.forEach((i, idx) => {
    if (Text.isText(i)) {
      deletedPaths.push(Editor.pathRef(editor, [...path, idx]))
    }
  })
  deletedPaths.forEach(ref => {
    const p = ref.unref()
    if (p) {
      console.log(p)
      Transforms.removeNodes(editor, { at: p })
    }
  })
  const now = Editor.node(editor, path)[0] as TableCellElement
  now.children.forEach((c, idx) => {
    if (!Element.isElement(c)) {
      Transforms.wrapNodes(editor, { type: 'paragraph', id: Id.getId(), children: [] }, { at: [...path, idx] })
    }
  })
}
