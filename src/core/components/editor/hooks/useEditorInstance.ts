import { assignProperties } from '@/utils'
import { atom, createStore, useAtomValue } from 'jotai'
import { createContext, RefObject, useContext, useRef } from 'react'
import { CustomEditor, IEditorInstance } from '~/typings'
import { goToBlock, goToTextHighlight, highlightBlock } from '../utils'
import { Node } from 'slate'
import assignBlockOps from '@/core/components/editor/hooks/instance/assignBlockOps'
import assignTextOps from '@/core/components/editor/hooks/instance/assignTextOps'
import assignToggle from '@/core/components/editor/hooks/instance/assignToggle'
import assignValueOps from '@/core/components/editor/hooks/instance/assignValueOps'
import assignSearchOps from '@/core/components/editor/hooks/instance/assignSearchOps'
import assignLabelOps from '@/core/components/editor/hooks/instance/assignLabelOps'
import getInsideMetas from '@/core/components/editor/utils/getInsideMetas'
import assignAIOps from '@/core/components/editor/components/AI/assignAIOps'
import { ReactEditor } from '@/core'
import { slateToMarkdown } from '@/core/components/editor/plugins/slateToMarkdown'
import slateToHTML from '@/core/components/editor/plugins/slateToHTML'

export const EditorInstanceAtom = atom<IEditorInstance>({})
export const EditorStoreContext = createContext<ReturnType<typeof createStore> | null>(null)

const useEditorInstance = () => {
  const store = useContext(EditorStoreContext)
  return useAtomValue(EditorInstanceAtom, { store: store })
}
const SelectionHighlight = 'selection-highlight'
export const useAssignEditorInstance = (editor: CustomEditor, scrollElementRef: RefObject<HTMLElement>) => {
  const instance = useEditorInstance()
  const eventsMapRef = useRef(new Map<string, Set<any>>())
  const eventsMap = eventsMapRef.current
  const getHighlightLocation = (highlightId: number) => {
    const iter = Node.texts(editor)
    const values = []
    for (const value of iter) {
      if ('highlight' in value[0] && value[0].highlight === highlightId) {
        values.push(value)
      }
    }
    return values
  }
  assignAIOps(instance, editor)
  assignSearchOps(instance, editor)
  assignBlockOps(instance, editor)
  assignTextOps(instance, editor)
  assignToggle(instance, editor)
  assignValueOps(instance, editor)
  assignLabelOps(instance, editor)
  assignProperties(instance, {
    serialize: (mode = 'markdown') => {
      if (mode === 'markdown') {
        return slateToMarkdown(editor.children)
      }
      if (mode === 'html') {
        return slateToHTML(editor.children).html
      }
      return slateToMarkdown(editor.children)
    },
    addEventListener: (k, f) => {
      const set = eventsMap.get(k) || new Set()
      set.add(f)
      eventsMap.set(k, set)
    },
    removeEventListener: (k, f) => {
      eventsMap.get(k)?.delete(f)
    },
    emitEvent: (k, a) => {
      eventsMap.get(k)?.forEach(f => f(a))
    },
    highlightBlock: id => {
      const idArr = Array.isArray(id) ? id : [id]
      idArr.forEach(id => {
        highlightBlock(id, editor)
      })
    },
    highlightCurrentSelection: () => {
      const highlight = new Highlight()
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        highlight.add(sel.getRangeAt(0))
        CSS.highlights.set(SelectionHighlight, highlight)
        return
      }
      if (editor.selection) {
        const range = ReactEditor.toDOMRange(editor, editor.selection)
        highlight.add(range)
        CSS.highlights.set(SelectionHighlight, highlight)
        return
      }
    },
    dehighlightSelection: () => {
      CSS.highlights.delete(SelectionHighlight)
    },
    scrollToBlock: async opts => {
      if (opts.blockId !== undefined) {
        await goToBlock(opts.blockId, editor)
        if (opts.highlight) {
          highlightBlock(opts.blockId, editor)
        }
      }
    },
    getInsideMetas: () => {
      const eles = editor.children
      const metas = getInsideMetas(eles)
      return Array.from(
        Object.keys(metas)
          .map(i => Number(i))
          .filter(i => i)
      )
    },
    getHighlightLocation,
    getScrollElement: () => scrollElementRef.current,
    selectBlock: async opts => {
      if (opts.blockId !== undefined) {
        instance.selectOps?.selectBlock(opts.blockId)
      }
    },
    scrollToHighlight: async opts => {
      goToTextHighlight(opts.highlightId, editor)
    },
    getSlateEditor: () => editor,
    getElementPathById: id => {
      return instance.values.ID_TO_PATH.get(id)
    },
    getOverlayManager: () => {
      return editor.overlayManager
    },
    getSelectedElements: () => {
      const elements = Array.from(instance.values.selectedBlocks.values())
        .map(i => i.element)
        .filter(i => i)
      return elements
    }
  })
}

export default useEditorInstance
