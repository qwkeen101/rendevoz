import Id from './utils/id'
import { Editor, Element as SlateElement, Node, Path, Point, Range, Text, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { CustomEditor, CustomElement } from '~/typings'
import { Positions } from '../utils/positions'
import EditorSettings from '../consts/settings'
import customInsertFragment from '../plugins/customInsertFragment'

const softBlockTypes: CustomElement['type'][] = ['code-block']

const withCustomComponent = (editor: CustomEditor) => {
  const { insertBreak, insertNodes, deleteForward, insertNode, insertFragment, apply, instance } = editor
  editor.insertSoftBreak = () => {
    editor.insertText('\n')
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
      // 如果当前行为空的paragraph，则允许修改type，否则把原row的所有属性复制上�?
      if (above && above[0].type === 'paragraph' && Editor.isStart(editor, p, above[1]) && Editor.isEnd(editor, p, above[1])) {
        insertFragment(nodes, options)
      } else {
        insertFragment(nodes, options)
        if (above && above[0].type !== 'paragraph') {
          const first = nodes[0]
          if (!Editor.isVoid(editor, first)) {
            Transforms.setNodes(editor, { ...above[0] }, { at: above[1] })
          }
        }
      }
      return
    }
    insertFragment(nodes, options)
  }
  editor.insertNode = node => {
    node.id = Id.getId()
    console.log(node)
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
    insertNodes(nodes, options)
  }
  editor.isElementReadOnly = e => {
    if (EditorSettings.ReadOnlyTypes.has(e.type)) {
      return true
    }
    return false
  }
  editor.isSelectable = e => {
    if (e.type === 'math' || e.type === 'math-block') return true
    if (Editor.isVoid(editor, e) && !Editor.isInline(editor, e)) {
      return false
    }
    return true
  }
  editor.deleteForward = (...args) => {
    const { selection } = editor
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
