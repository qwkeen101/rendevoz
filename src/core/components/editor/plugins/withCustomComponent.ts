import Id from '@/utils/id'
import { Editor, Element as SlateElement, Node, Path, Point, Range, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { CustomEditor, CustomElement } from '~/typings'
import { Positions } from '../utils/positions'
import { MetaStore, ObjectStore } from '@/api/stores'

const softBlockTypes: CustomElement['type'][] = ['highlight-block', 'block-quote']

const withCustomComponent = (editor: CustomEditor) => {
  const { deleteBackward, insertText, insertBreak, deleteForward, insertNode, insertFragment, apply, instance } = editor
  editor.insertSoftBreak = () => {
    editor.insertText('\n')
  }
  editor.insertFragment = nodes => {
    nodes.forEach(i => (i.id = Id.getId()))
    insertFragment(nodes)
  }
  editor.insertNode = node => {
    node.id = Id.getId()
    // node.children[0].fontSize = fontSize
    let nextPath = null
    // check if insert inside hole or spacer
    if (Positions.isStartSpacer(editor) || Positions.isEndSpacer(editor) || Positions.outermostBlock(editor)?.[0]?.type === 'hole') {
      const wrapper = Positions.outermostBlock(editor)
      if (Positions.isStartSpacer(editor)) {
        nextPath = wrapper[1]
      } else {
        nextPath = Path.next(wrapper[1])
      }
    }
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
  editor.insertText = (text: string) => {
    insertText(text)
  }

  editor.isElementReadOnly = e => {
    if (e.type === 'inline-metaObject') {
      return true
    }
    return false
  }
  // editor.isSelectable = e => {
  //   if (e.type === 'inline-metaObject') {
  //     return false
  //   }
  //   if (editor.isVoid(e)) {
  //     return false
  //   }
  //   return true
  // }
  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n)
      })
      const [cell] = Editor.nodes(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'tableCell'
      })
      if (cell) {
        const [, cellPath] = cell
        const start = Editor.start(editor, cellPath)

        if (Point.equals(selection.anchor, start)) {
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
        let selectPrevious = false
        if (currentPrevious && Point.equals(selection.anchor, start)) {
          const [block, path] = currentPrevious
          if (Editor.isVoid(editor, block)) {
            Transforms.removeNodes(editor, { at: path })
            return
          } else {
            selectPrevious = true
          }
        }
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
        if (selectPrevious && currentPrevious) {
          deleteBackward(...args)
          Transforms.select(editor, Editor.end(editor, currentPrevious[1]))
          return
        }
      }
      deleteBackward(...args)
    }
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
          if ('type' in block && block.type.startsWith('heading')) {
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
    if (op.type !== 'set_selection') {
      editor.onOperationApplied?.(op)
    }
    apply(op)
  }
  return editor
}

export default withCustomComponent
