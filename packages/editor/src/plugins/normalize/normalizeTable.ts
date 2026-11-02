import { CustomEditor, CustomElement, TableCellElement } from '~/typings'
import { Editor, Path, PathRef, Transforms } from 'slate'

export default function normalizeTable(node: CustomElement, path: Path, editor: CustomEditor) {
  if (node.type === 'tableRow') {
    console.log('trigger')
    const [parentTable] = Editor.node(editor, Path.parent(path))
    if ('type' in parentTable && parentTable.type === 'table') {
      const originTarget: {
        origin: PathRef
        target: Path
      }[] = []
      console.log(parentTable)
      node.children.forEach((c, index) => {
        console.log(c, index)
        const idx = parentTable.columns.findIndex(o => o.accessor === c.colName)
        if (idx >= 0 && idx !== index) {
          originTarget.push({
            o: [...path, index],
            origin: Editor.pathRef(editor, [...path, index]),
            target: [...path, idx]
          })
        }
      })
      console.log(originTarget)
      if (originTarget.length) {
        originTarget.forEach(o => {
          const origin = o.origin.unref()
          if (origin) {
            console.log(origin, o.target)
            Transforms.moveNodes(editor, { at: origin, to: o.target })
          }
        })
      }
    }
  }
  if (node.type === 'table') {
    node.children.forEach((n, idx) => {
      normalizeTable(n, [...path, idx], editor)
    })
  }
}
