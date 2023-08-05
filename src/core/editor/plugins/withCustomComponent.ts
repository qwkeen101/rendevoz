import Id from '@/utils/id'
import { Editor, Element as SlateElement, Path, Point, Range, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { CustomEditor, CustomElement } from '~/typings'
import { Positions } from '../utils/positions'

const softBlockTypes: CustomElement['type'][] = ['highlight-block', 'block-quote']

const withCustomComponent = (editor: CustomEditor) => {
  const { deleteBackward, insertText, insertBreak, deleteForward, insertNode, insertFragment, apply } = editor
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
        const [block, path] = match
        const start = Editor.start(editor, path)
        const currentPrevious = Editor.previous(editor, { at: path })
        if (currentPrevious && Point.equals(selection.anchor, start)) {
          const [block] = currentPrevious
          if (Editor.isVoid(editor, block)) {
            Transforms.removeNodes(editor, { at: path })
            return
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

          if (block.type === 'list-item') {
            Transforms.unwrapNodes(editor, {
              match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'bulleted-list',
              split: true
            })
          }

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
              console.log('yrs')
              const p = Editor.after(editor, Editor.end(editor, curr[1]))
              if (p) {
                Transforms.select(editor, p)
              }
            }
          }
          Transforms.splitNodes(editor, {
            always: true
          })
          if ('type' in block && block.type.startsWith('heading')) {
            Transforms.setNodes(
              editor,
              { id: Id.getId(), type: 'paragraph', background: undefined, color: undefined },
              { at: Path.next(path) }
            )
          } else {
            Transforms.setNodes(editor, { id: Id.getId(), background: undefined, color: undefined }, { at: Path.next(path) })
          }

          return
        }
      }
    }

    insertBreak()
  }
  editor.apply = op => {
    const { emitter } = editor
    if (emitter) {
      if (op.type !== 'set_selection' && editor.initialized) {
        emitter.emit('editor', {
          type: 'operationApplied',
          data: {
            noteId: editor.noteId,
            id: editor.id,
            operation: op
          }
        })
      }
    }
    apply(op)
  }
  return editor
}

export default withCustomComponent
