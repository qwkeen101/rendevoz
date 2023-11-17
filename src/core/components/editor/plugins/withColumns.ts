import { CustomEditor, CustomElement } from '~/typings'
import { Transforms } from 'slate'

const withColumns = (e: CustomEditor) => {
  const { normalizeNode } = e
  e.normalizeNode = entry => {
    const [node, path] = entry
    if ('type' in node) {
      if (node.type === 'column') {
        if (node.children.length === 0) {
          Transforms.removeNodes(e, { at: path })
          return
        }
      }
      if (node.type === 'columnList') {
        if (node.children.length === 0) {
          Transforms.removeNodes(e, {
            at: path
          })
        }
        if (node.children.length === 1 && node.children[0].type === 'column') {
          Transforms.unwrapNodes(e, {
            at: [...path, 0]
          })
          Transforms.unwrapNodes(e, {
            at: path
          })
          return
        }
      }
    }
    normalizeNode(entry)
  }
  return e
}

export default withColumns
