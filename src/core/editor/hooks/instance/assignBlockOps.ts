import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { Editor, Element, Transforms } from 'slate'

const MAX_INDENT = 6
const assignBlockOps = (instance: IEditorInstance, editor: CustomEditor) => {
  assignProperties(instance, {
    blockOps: {
      isIndentableBlock: type => {
        if (type === 'list-item' || type === 'order-list-item') {
          return true
        }
        return false
      },
      // insert indent for hiden blocks too
      insertBlockIndent: (path, recursive) => {
        const currentNode = Editor.node(editor, path)
        if (currentNode) {
          const block = currentNode[0] as CustomElement
          if ('type' in block && (block.type === 'list-item' || block.type === 'order-list-item')) {
            const nextIndent = (block.level || 0) + 1
            if (recursive !== false) {
              const underNodes = instance.toggleOps?.getUnderNodes(path)
              if (underNodes && underNodes?.length > 1) {
                if (underNodes.some(([e]) => (e.level || 0) + 1 > MAX_INDENT)) return
                underNodes?.forEach(([e, path]) => {
                  instance.blockOps?.insertBlockIndent(path, false)
                })
              }
            }

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
      // minus indent for hiden blocks
      minusBlockIndent: (path, recursive) => {
        const currentNode = Editor.node(editor, path)
        if (currentNode) {
          const block = currentNode[0] as CustomElement
          if ('type' in block && (block.type === 'list-item' || block.type === 'order-list-item')) {
            const nextIndent = (block.level || 0) - 1
            if (recursive !== false && nextIndent >= 0) {
              const underNodes = instance.toggleOps?.getUnderNodes(path)
              if (underNodes && underNodes?.length > 1) {
                underNodes?.forEach(([e, path]) => {
                  // 嵌套节点的层级不能小于等于当前节点
                  if ((e.level || 0) - 1 <= nextIndent) {
                    return
                  }
                  instance.blockOps?.minusBlockIndent(path, false)
                })
              }
            }
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
