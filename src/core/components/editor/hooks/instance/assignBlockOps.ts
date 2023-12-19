import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { Editor, Element, Node, Path, Transforms } from 'slate'
import Id from '@/utils/id'
import { ReactEditor } from '@/core'

const MAX_INDENT = 6
export const transformableTargetType = [
  'paragraph',
  'heading-one',
  'heading-two',
  'heading-three',
  'heading-four',
  'block-quote',
  'order-list-item',
  'list-item',
  'to-do',
  'code'
]

const untransformableOriginalType = ['table', 'metaObject', 'synced']
const assignBlockOps = (instance: IEditorInstance, editor: CustomEditor) => {
  assignProperties(instance, {
    blockOps: {
      isBlockEmpty: el => {
        if (editor.isVoid(el)) {
          return false
        }
        if (el.hide) {
          return true
        }
        return el.children.length === 1 && el.children[0].text === ''
      },
      copyLink: () => {
        const selected = instance.getSelectedElements?.()
        if (selected?.length) {
          editor.on?.({
            type: 'copyLink',
            blocks: selected.map(i => ({
              id: i.id,
              text: Node.string(i) || i.content || ''
            }))
          })
        }
      },
      duplicateSelectedBlocks: () => {
        const selected = instance.getSelectedElements?.()
        if (selected?.length) {
          // use structure clone to avoid pointer issue
          const newElements = selected.map(i => ({ ...structuredClone(i), id: Id.getId() }))
          const lastPath = instance.getElementPathById?.(selected[selected.length - 1].id)
          if (lastPath) {
            Transforms.insertNodes(editor, newElements, {
              at: Path.next(lastPath)
            })
            instance.selectOps?.deselectAll()
            instance.indexPath?.()
            setTimeout(() => {
              // select new elements and scroll to first
              const firstId = newElements[0].id
              instance.selectOps?.selectBlock(newElements.map(i => i.id))
              instance.scrollToBlock?.({
                blockId: firstId
              })
            })
          }
        }
      },
      getCurrentCursorBlockText: () => {
        const selection = editor.selection
        if (selection) {
          const block = Editor.node(editor, selection)
          if (block) {
            return Node.string(block[0])
          }
        }
      },
      getCurrentCursorBlockBounding: () => {
        const block = instance.blockOps?.getAboveBlock()
        if (block) {
          try {
            const node = ReactEditor.toDOMNode(editor, block[0])
            if (node) {
              return node.getBoundingClientRect()
            }
          } catch (e) {
            console.error(e)
          }
        }
      },
      deleteBlock: path => {
        const selected = instance.values.selectedBlocks
        if (selected.size > 0) {
          // delete all
          if (instance.values.selectingAll) {
            instance.values.selectingAll = false
            selected.forEach(v => {
              v.pathRef?.unref()
            })
            selected.clear()
            Transforms.removeNodes(editor, {
              at: Editor.range(editor, [0], [editor.children.length - 1])
            })
          }
          const hasPaths = Array.from(selected.values()).filter(i => i.pathRef)
          const elements = hasPaths
            .map(n => {
              if (n.pathRef?.current) return Editor.node(editor, n.pathRef.current)[0]
            })
            .filter(i => i) as CustomElement[]
          hasPaths.forEach(i => i.pathRef?.unref())
          const extended = instance.toggleOps?.extendElements(elements)
          if (extended?.length) {
            const extendedWithPathRef = extended.map(e => ({
              element: e[0],
              pathRef: Editor.pathRef(editor, e[1])
            }))

            Editor.withoutNormalizing(editor, () => {
              extendedWithPathRef.forEach(i => {
                i.pathRef.current &&
                  Transforms.removeNodes(editor, {
                    at: i.pathRef.current
                  })
                i.pathRef.unref()
              })
            })
            selected.clear()
          }
        } else {
          if (!path) return
          const currentNode = Editor.node(editor, path)
          const extended = instance.toggleOps?.extendElements(currentNode[0] as CustomElement)
          if (extended?.length) {
            const extendedWithPathRef = extended.map(e => ({
              element: e[0],
              pathRef: Editor.pathRef(editor, e[1])
            }))

            Editor.withoutNormalizing(editor, () => {
              extendedWithPathRef.forEach(i => {
                i.pathRef.current &&
                  Transforms.removeNodes(editor, {
                    at: i.pathRef.current
                  })
                i.pathRef.unref()
              })
            })
          }
        }
        if (!editor.children.length) {
          Transforms.insertNodes(editor, {
            type: 'paragraph',
            id: Id.getId(),
            children: [{ text: '' }]
          })
          Transforms.select(editor, [0])
          ReactEditor.focus(editor)
        }
      },
      isIndentableBlock: type => {
        if (type === 'list-item' || type === 'order-list-item') {
          return true
        }
        return false
      },
      // 如果目标block里有
      transformBlockType: (path, newType) => {
        const originNode = Editor.node(editor, path)
        if (originNode) {
          const type = originNode[0].type as string
          if (untransformableOriginalType.includes(type)) return
          const block = originNode[0]
          const newBlock = { ...block, type: newType }
          const isTargetTypeTogglable = instance.toggleOps?.isTogglableElement(newBlock)
          // if new type not togglable, remove level
          if (!isTargetTypeTogglable) {
            if (block.level) {
              newBlock.level = undefined
            }
          }
          Transforms.setNodes(editor, newBlock, { at: path })
        }
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
