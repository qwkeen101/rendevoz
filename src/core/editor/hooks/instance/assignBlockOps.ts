import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { Editor, Element, Transforms } from 'slate'

const MAX_INDENT = 5
const assignBlockOps = (instance: IEditorInstance, editor: CustomEditor) => {
  assignProperties(instance, {
    blockOps: {
      isIndentableBlock: type => {
        if (type === 'list-item' || type === 'order-list-item') {
          return true
        }
        return false
      },
      insertBlockIndent: path => {
        const currentNode = Editor.node(editor, path)
        if (currentNode) {
          const block = currentNode[0] as CustomElement
          if ('type' in block && (block.type === 'list-item' || block.type === 'order-list-item')) {
            const nextIndent = (block.level || 0) + 1
            if (nextIndent <= MAX_INDENT) {
              Transforms.setNodes(
                editor,
                {
                  level: nextIndent
                },
                {
                  at: path
                }
              )
            }
          }
        }
      },
      minusBlockIndent: path => {
        const currentNode = Editor.node(editor, path)
        if (currentNode) {
          const block = currentNode[0] as CustomElement
          if ('type' in block && (block.type === 'list-item' || block.type === 'order-list-item')) {
            const nextIndent = (block.level ?? 1) - 1
            if (nextIndent >= 0) {
              Transforms.setNodes(
                editor,
                {
                  level: nextIndent
                },
                {
                  at: path
                }
              )
            }
          }
        }
      },
      getAboveBlock: () => {
        const block = Editor.above(editor, {
          match: n => Element.isElement(n) && 'type' in n
        })
        if (block) {
          return [block[0] as CustomElement, block[1]]
        }
      }
    }
  })
}

export default assignBlockOps
