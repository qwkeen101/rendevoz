import Id from '@/utils/id'
import { Editor, Element as SlateElement, Node, Path, Point, Range, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { CustomEditor, CustomElement } from '~/typings'
import { Positions } from '../utils/positions'
import EditorSettings from '@/core/components/editor/consts/settings'

const softBlockTypes: CustomElement['type'][] = []

const withCustomComponent = (editor: CustomEditor) => {
  const { deleteBackward, insertText, splitNodes, insertBreak, insertNodes, deleteForward, insertNode, insertFragment, apply, instance } =
    editor
  editor.insertSoftBreak = () => {
    editor.insertText('\n')
  }
  editor.splitNodes = opts => {
    console.log(opts)
    splitNodes(opts)
  }
  editor.insertFragment = (nodes, options) => {
    nodes.forEach(i => (i.id = Id.getId()))
    const position = options?.at || editor.selection
    if (!position) return
    // can not insert fragment to table
    if (
      Editor.above(editor, {
        match: n => n.type === 'table',
        at: position
      })
    ) {
      Transforms.insertText(editor, Node.string({ children: nodes }), { at: position })
      return
    }
    // insert at list-item/heading,.etc, and only text
    // do not remove it, and only insert text
    if (Range.isCollapsed(position)) {
      const above = Editor.above(editor, {
        at: position,
        match: n => Editor.isBlock(editor, n)
      })
      const p = Editor.point(editor, position)
      if (above && Editor.isStart(editor, p, above[1]) && Editor.isEnd(editor, p, above[1])) {
        insertFragment(nodes)
        Transforms.setNodes(editor, { ...above[0] }, { at: above[1] })
        return
      }
    }
    insertFragment(nodes)
  }
  editor.insertNode = node => {
    node.id = Id.getId()
    console.log(node)
    // node.children[0].fontSize = fontSize
    let nextPath = null
    if (Positions.isInsideCommonBlock(editor)) {
      let finalInsertPath
      const nextRowPath = Positions.nextRowOfCurrentSelection(editor)
      const currPath = Path.previous(nextRowPath)
      const currNode = Editor.node(editor, currPath)
      const currElement = currNode[0]
      if (Editor.isEmpty(editor, currElement)) {
        finalInsertPath = currPath
      } else {
        finalInsertPath = nextRowPath
      }
      if (finalInsertPath) {
        const placeHolderParagraph = {
          type: 'paragraph',
          id: Id.getId(),
          children: [{ text: '' }]
        }
        Transforms.insertNodes(editor, node, { at: finalInsertPath })
        Transforms.select(editor, Editor.end(editor, finalInsertPath))
        ReactEditor.focus(editor)
        const placeHolderPath = Path.next(finalInsertPath)
        const { children } = editor
        if (children.length === placeHolderPath[0]) {
          console.log('add placeholder')
          Transforms.insertNodes(editor, placeHolderParagraph, {
            at: placeHolderPath
          })
        }
        return
      }
    }
    if (nextPath) {
      Transforms.insertNodes(editor, node, { at: nextPath })

      Transforms.select(editor, Editor.end(editor, nextPath))
    } else {
      insertNode(node)
    }
  }
  editor.insertNodes = (nodes, options) => {
    console.log(nodes)
    const path = options?.at || editor.selection
    const isAllNodesBlock = (Array.isArray(nodes) ? nodes : [nodes]).every(i => 'type' in i && !Editor.isInline(editor, i))
    if (isAllNodesBlock && path && Editor.hasPath(editor, Editor.path(editor, path))) {
      const emptyParagraph = Editor.above(editor, {
        at: path,
        match: currElement => currElement.type === 'paragraph' && currElement.children.length === 1 && currElement.children[0].text === ''
      })
      if (emptyParagraph) {
        Transforms.removeNodes(editor, { at: emptyParagraph[1] })
      }
    }
    insertNodes(nodes, options)
  }
  editor.insertText = (text: string) => {
    insertText(text)
  }

  editor.isElementReadOnly = e => {
    if (EditorSettings.ReadOnlyTypes.has(e.type)) {
      return true
    }
    return false
  }
  editor.isSelectable = e => {
    if (Editor.isVoid(editor, e) && !Editor.isInline(editor, e)) {
      return false
    }
    return true
  }
  editor.deleteBackward = (...args) => {
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
        if (block.type === 'code-block') {
          setTimeout(() => {
            editor.instance.selectOps?.selectBlock(block.id)
          })
          return
        }
        const start = Editor.start(editor, path)
        const currentPrevious = Editor.previous(editor, { at: path })

        if (block.level > 0 && Editor.isStart(editor, selection.anchor, path)) {
          Transforms.setNodes(editor, {
            level: block.level - 1 > 0 ? block.level - 1 : undefined
          })
          return
        }
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
            Transforms.removeNodes(editor, {
              at: path
            })
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
  editor.deleteForward = (...args) => {
    const { selection } = editor
    console.log('delete here')
    if (selection && Range.isCollapsed(selection)) {
      const [cell] = Editor.nodes(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'tableCell'
      })

      if (cell) {
        const [, cellPath] = cell
        const end = Editor.end(editor, cellPath)

        if (Point.equals(selection.anchor, end)) {
          return
        }
      }
    }
    deleteForward(...args)
  }
  editor.insertBreak = () => {
    const { selection } = editor
    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n)
      })
      if (match) {
        const [block, path] = match
        if (softBlockTypes.includes(block.type)) {
          editor.insertSoftBreak()
          return
        }
        const leaf = Editor.leaf(editor, selection)[0]
        const offset = selection.anchor.offset as number
        if (leaf.text[offset] === '\n') {
          Transforms.delete(editor, {
            at: selection,
            unit: 'character',
            distance: 1
          })
        }
        if (offset - 1 >= 0 && leaf.text[offset - 1] === '\n') {
          Transforms.delete(editor, {
            at: selection,
            unit: 'character',
            distance: 1,
            reverse: true
          })
        }
        const currentParent = Editor.parent(editor, path)
        if (currentParent) {
          const curr = Editor.above(editor)
          if (curr?.[0].type === 'link' && editor.selection) {
            if (Point.equals(Editor.end(editor, curr[1]), editor.selection.focus)) {
              const p = Editor.after(editor, Editor.end(editor, curr[1]))
              if (p) {
                Transforms.select(editor, p)
              }
            }
          }
          const offsetPath = instance.toggleOps?.getFoldedOffsetPath(path)
          Transforms.splitNodes(editor, {
            always: true
          })
          // remove marks in new line
          // https://github.com/Rendevoz/Rendevoz/issues/89
          const nextLinePath = Path.next(path)
          const nextLineEle = Editor.node(editor, nextLinePath)[0]
          console.log(nextLineEle)
          if ('type' in nextLineEle) {
            // empty text paragraph
            if (nextLineEle.children.length === 1 && nextLineEle.children[0].text === '') {
              Transforms.select(editor, nextLinePath)
              // remove all marks in new line
              const marks = Editor.marks(editor)
              console.log(marks)
              if (marks) {
                Object.keys(marks).forEach(mark => {
                  Editor.removeMark(editor, mark)
                  Transforms.setNodes(
                    editor,
                    {
                      [mark]: undefined
                    },
                    {
                      at: [...nextLinePath, 0]
                    }
                  )
                })
              }
            }
          }
          if (('type' in block && block.type.startsWith('heading')) || ['highlight-block', 'block-quote'].includes(block.type)) {
            Transforms.setNodes(
              editor,
              { id: Id.getId(), type: 'paragraph', background: undefined, color: undefined },
              { at: nextLinePath }
            )
          } else {
            Transforms.setNodes(editor, { id: Id.getId(), background: undefined, color: undefined, folded: false }, { at: nextLinePath })
          }

          if (offsetPath && offsetPath !== path) {
            Transforms.moveNodes(editor, {
              at: nextLinePath,
              to: offsetPath
            })
          }
          return
        }
      }
    }

    insertBreak()
  }
  editor.apply = op => {
    console.log(op)
    if (op.type !== 'set_selection') {
      editor.onOperationApplied?.(op)
    }
    apply(op)
  }
  return editor
}

export default withCustomComponent
