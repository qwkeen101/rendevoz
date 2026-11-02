import { CustomEditor, CustomElement } from '~/typings'
import { Editor, Element as SlateElement, Node, Path, Point, Range, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'

export default (editor: CustomEditor) => {
  const { deleteBackward } = editor
  editor.deleteBackward = (...args) => {
    console.log('trigger here')
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n)
      })
      const [nestedParent] = Editor.nodes(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && ['tableCell', 'synced'].includes(n.type)
      })
      if (nestedParent) {
        const [nestedParentBlock, nestParentPath] = nestedParent
        const start = Editor.start(editor, nestParentPath)

        if (Point.equals(selection.anchor, start)) {
          if (nestedParentBlock.children[0].type !== 'paragprah') {
            Transforms.setNodes(
              editor,
              {
                type: 'paragraph'
              },
              {
                at: [...nestParentPath, 0]
              }
            )
          }
          return
        }
      }
      if (match) {
        console.log(match)
        const [block, path] = match
        const start = Editor.start(editor, path)
        const currentPrevious = Editor.previous(editor, { at: path })
        // 缩进-1
        if (block.level > 0 && Editor.isStart(editor, selection.anchor, path)) {
          Transforms.setNodes(editor, {
            level: block.level - 1 > 0 ? block.level - 1 : undefined
          })
          return
        }
        // 不是paragraph的，变成paragraph
        if (
          !Editor.isEditor(block) &&
          SlateElement.isElement(block) &&
          block.type !== 'paragraph' &&
          Point.equals(selection.anchor, start)
        ) {
          const newProperties: Partial<SlateElement> = {
            type: 'paragraph'
          }
          Transforms.setNodes(editor, newProperties)
          return
        }
        if (currentPrevious) {
          const b = currentPrevious[0] as CustomElement
          // delete on start and previous is list item
          if (Editor.isStart(editor, selection.anchor, path) && (b.type === 'list-item' || b.type === 'order-list-item')) {
            deleteBackward(...args)
            Transforms.setNodes(
              editor,
              {
                align: undefined,
                color: undefined,
                background: undefined,
                ...b
              },
              {
                at: currentPrevious[1]
              }
            )
            return
          }
        }

        let selectPrevious = false
        if (currentPrevious && Point.equals(selection.anchor, start)) {
          const [block] = currentPrevious
          if (Editor.isVoid(editor, block)) {
            editor.instance.selectOps?.selectBlock(block.id)
            Transforms.deselect(editor)
            if (editor.instance.blockOps?.isBlockEmpty(match[0])) {
              Transforms.removeNodes(editor, {
                at: path
              })
            }
            return
          } else {
            selectPrevious = true
          }
        }

        if (selectPrevious && currentPrevious) {
          const end = Editor.end(editor, currentPrevious[1])
          deleteBackward(...args)
          // 当上方为空的同步块，下方为空的行，在下方删除，会导致blur
          // timeout以后再选择可以避免
          setTimeout(() => {
            Transforms.select(editor, end)
            ReactEditor.focus(editor)
          }, 0)
          return
        }
      }
      deleteBackward(...args)
    }
  }
  return editor
}
