import { BaseEditor, Element, Editor, Node, Operation, Path, Point, Range, Transforms } from 'slate'
import { TextDiff, transformPendingPoint, transformPendingRange, transformTextDiff } from '../utils/diff-text'
import { getPlainText, getSlateFragmentAttribute } from '../utils/dom'
import { Key } from '../utils/key'
import { findCurrentLineRange } from '../utils/lines'
import {
  EDITOR_TO_KEY_TO_ELEMENT,
  EDITOR_TO_ON_CHANGE,
  EDITOR_TO_PENDING_ACTION,
  EDITOR_TO_PENDING_DIFFS,
  EDITOR_TO_PENDING_INSERTION_MARKS,
  EDITOR_TO_PENDING_SELECTION,
  EDITOR_TO_SCHEDULE_FLUSH,
  EDITOR_TO_USER_MARKS,
  EDITOR_TO_USER_SELECTION,
  NODE_TO_KEY
} from '../utils/weak-maps'
import { ReactEditor } from './react-editor'
import slateToHTML from '@/core/components/editor/plugins/slateToHTML'
import { CustomEditor } from '~/typings'

/**
 * `withReact` adds React and DOM specific behaviors to the editor.
 *
 * If you are using TypeScript, you must extend Slate's CustomTypes to use
 * this plugin.
 *
 * See https://docs.slatejs.org/concepts/11-typescript to learn how.
 */

export const withReact = <T extends BaseEditor>(editor: T): T & ReactEditor => {
  const e = editor as T & ReactEditor
  const { apply, onChange, deleteBackward, addMark, removeMark } = e

  // The WeakMap which maps a key to a specific HTMLElement must be scoped to the editor instance to
  // avoid collisions between editors in the DOM that share the same value.
  EDITOR_TO_KEY_TO_ELEMENT.set(e, new WeakMap())

  e.addMark = (key, value) => {
    EDITOR_TO_SCHEDULE_FLUSH.get(e)?.()

    if (!EDITOR_TO_PENDING_INSERTION_MARKS.get(e) && EDITOR_TO_PENDING_DIFFS.get(e)?.length) {
      // Ensure the current pending diffs originating from changes before the addMark
      // are applied with the current formatting
      EDITOR_TO_PENDING_INSERTION_MARKS.set(e, null)
    }

    EDITOR_TO_USER_MARKS.delete(e)

    addMark(key, value)
  }

  e.removeMark = key => {
    if (!EDITOR_TO_PENDING_INSERTION_MARKS.get(e) && EDITOR_TO_PENDING_DIFFS.get(e)?.length) {
      // Ensure the current pending diffs originating from changes before the addMark
      // are applied with the current formatting
      EDITOR_TO_PENDING_INSERTION_MARKS.set(e, null)
    }

    EDITOR_TO_USER_MARKS.delete(e)

    removeMark(key)
  }

  e.deleteBackward = unit => {
    if (unit !== 'line') {
      return deleteBackward(unit)
    }

    if (e.selection && Range.isCollapsed(e.selection)) {
      const parentBlockEntry = Editor.above(e, {
        match: n => Editor.isBlock(e, n),
        at: e.selection
      })

      if (parentBlockEntry) {
        const [, parentBlockPath] = parentBlockEntry
        const parentElementRange = Editor.range(e, parentBlockPath, e.selection.anchor)

        const currentLineRange = findCurrentLineRange(e, parentElementRange)

        if (!Range.isCollapsed(currentLineRange)) {
          Transforms.delete(e, { at: currentLineRange })
        }
      }
    }
  }

  // This attempts to reset the NODE_TO_KEY entry to the correct value
  // as apply() changes the object reference and hence invalidates the NODE_TO_KEY entry
  e.apply = (op: Operation) => {
    ;(e as CustomEditor).changeHandled = false
    const matches: [Path, Key][] = []

    const pendingDiffs = EDITOR_TO_PENDING_DIFFS.get(e)
    if (pendingDiffs?.length) {
      const transformed = pendingDiffs.map(textDiff => transformTextDiff(textDiff, op)).filter(Boolean) as TextDiff[]

      EDITOR_TO_PENDING_DIFFS.set(e, transformed)
    }

    const pendingSelection = EDITOR_TO_PENDING_SELECTION.get(e)
    if (pendingSelection) {
      EDITOR_TO_PENDING_SELECTION.set(e, transformPendingRange(e, pendingSelection, op))
    }

    const pendingAction = EDITOR_TO_PENDING_ACTION.get(e)
    if (pendingAction?.at) {
      const at = Point.isPoint(pendingAction?.at)
        ? transformPendingPoint(e, pendingAction.at, op)
        : transformPendingRange(e, pendingAction.at, op)

      EDITOR_TO_PENDING_ACTION.set(e, at ? { ...pendingAction, at } : null)
    }

    switch (op.type) {
      case 'insert_text':
      case 'remove_text':
      case 'set_node':
      case 'split_node': {
        matches.push(...getMatches(e, op.path))
        break
      }

      case 'set_selection': {
        // Selection was manually set, don't restore the user selection after the change.
        EDITOR_TO_USER_SELECTION.get(e)?.unref()
        EDITOR_TO_USER_SELECTION.delete(e)
        break
      }

      case 'insert_node':
      case 'remove_node': {
        matches.push(...getMatches(e, Path.parent(op.path)))
        break
      }

      case 'merge_node': {
        const prevPath = Path.previous(op.path)
        matches.push(...getMatches(e, prevPath))
        break
      }

      case 'move_node': {
        const commonPath = Path.common(Path.parent(op.path), Path.parent(op.newPath))
        matches.push(...getMatches(e, commonPath))
        break
      }
    }

    apply(op)

    for (const [path, key] of matches) {
      const [node] = Editor.node(e, path)
      NODE_TO_KEY.set(node, key)
    }
  }

  e.setFragmentData = (data: Pick<DataTransfer, 'getData' | 'setData'>) => {
    const { selection } = e

    if (!selection) {
      return
    }
    const [start, end] = Range.edges(selection)
    const startVoid = Editor.void(e, { at: start.path })
    const endVoid = Editor.void(e, { at: end.path })
    if (Range.isCollapsed(selection)) {
      data.setData('text/plain', window.getSelection()?.toString() ?? '')
      return
    }
    // Create a fake selection so that we can add a Base64-encoded copy of the
    // fragment to the HTML, to decode on future pastes.
    const domRange = ReactEditor.toDOMRange(e, selection)
    let contents = domRange.cloneContents()

    if (endVoid) {
      const [voidNode] = endVoid
      const r = domRange.cloneRange()
      const domNode = ReactEditor.toDOMNode(e, voidNode)
      r.setEndAfter(domNode)
      contents = r.cloneContents()
    }
    // Remove any zero-width space spans from the cloned DOM so that they don't
    // show up elsewhere when pasted.
    Array.from(contents.querySelectorAll('[data-slate-zero-width]')).forEach(zw => {
      const isNewline = zw.getAttribute('data-slate-zero-width') === 'n'
      zw.textContent = isNewline ? '\n' : ''
    })

    const above = Editor.above(e, {
      mode: 'highest',
      match: n => Element.isElement(n)
    })
    const isSelectFromStart = above && Editor.isStart(e, start, above[1])
    let fragment = [...e.getFragment()]
    if (startVoid) {
      fragment.shift()
    } else {
      if (!isSelectFromStart && fragment.length) {
        fragment[0] = { ...fragment[0], type: 'paragraph' }
      }
    }
    if (fragment.length) {
      const { html } = slateToHTML(fragment)
      console.log(fragment, html)
      data.setData('text/html', html)
    }
    const div = contents.ownerDocument.createElement('div')
    div.appendChild(contents)
    div.setAttribute('hidden', 'true')
    contents.ownerDocument.body.appendChild(div)
    const text = getPlainText(div)
    console.log(text, div)
    data.setData('text/plain', text)
    contents.ownerDocument.body.removeChild(div)
    return data
  }

  e.insertData = (data: DataTransfer) => {
    if (!e.insertFragmentData(data)) {
      e.insertTextData(data)
    }
  }

  e.insertFragmentData = (data: DataTransfer): boolean => {
    /**
     * Checking copied fragment from data-slate-fragment
     */
    const fragment = getSlateFragmentAttribute(data)

    if (fragment) {
      const decoded = decodeURIComponent(window.atob(fragment))
      const parsed = JSON.parse(decoded) as Node[]
      e.insertFragment(parsed)
      return true
    }
    return false
  }

  e.insertTextData = (data: DataTransfer): boolean => {
    const text = data.getData('text/plain')

    if (text) {
      const lines = text.split(/\r\n|\r|\n/)
      let split = false

      for (const line of lines) {
        if (split) {
          Transforms.splitNodes(e, { always: true })
        }

        e.insertText(line)
        split = true
      }
      return true
    }
    return false
  }

  e.onChange = () => {
    const onContextChange = EDITOR_TO_ON_CHANGE.get(e)

    if (onContextChange) {
      onContextChange()
    }

    onChange()
  }

  return e
}

const getMatches = (e: Editor, path: Path) => {
  const matches: [Path, Key][] = []
  for (const [n, p] of Editor.levels(e, { at: path })) {
    const key = ReactEditor.findKey(e, n)
    matches.push([p, key])
  }
  return matches
}
