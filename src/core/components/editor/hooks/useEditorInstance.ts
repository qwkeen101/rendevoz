import { assignProperties } from '@/utils'
import { atom, createStore, useAtomValue } from 'jotai'
import { createContext, RefObject, useContext } from 'react'
import { CustomEditor, IEditorInstance } from '~/typings'
import { goToBlock, goToTextHighlight, highlightBlock, selectBlock, waitForEditorContentInitialized } from '../utils'
import { Editor, Node, Range } from 'slate'
import { ID_TO_ELEMENTS_MAP, ID_TO_PATH_MAP } from '../weakMaps'
import useEditorBarState from './useEditorBarState'
import assignBlockOps from '@/core/components/editor/hooks/instance/assignBlockOps'
import assignTextOps from '@/core/components/editor/hooks/instance/assignTextOps'
import assignToggle from '@/core/components/editor/hooks/instance/assignToggle'
import assignValueOps from '@/core/components/editor/hooks/instance/assignValueOps'
import assignSearchOps from '@/core/components/editor/hooks/instance/assignSearchOps'
import assignLabelOps from '@/core/components/editor/hooks/instance/assignLabelOps'
import getInsideMetas from '@/core/components/editor/utils/getInsideMetas'

export const EditorInstanceAtom = atom<IEditorInstance>({})
export const EditorStoreContext = createContext<ReturnType<typeof createStore> | null>(null)
const useEditorInstance = () => {
  const store = useContext(EditorStoreContext)
  return useAtomValue(EditorInstanceAtom, { store: store })
}

export const useAssignEditorInstance = (editor: CustomEditor, scrollElementRef: RefObject<HTMLElement>) => {
  const instance = useEditorInstance()
  const [barState, setEditorBarState] = useEditorBarState()
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

  assignSearchOps(instance, editor)
  assignBlockOps(instance, editor)
  assignTextOps(instance, editor)
  assignToggle(instance, editor)
  assignValueOps(instance, editor)
  assignLabelOps(instance, editor)
  assignProperties(instance, {
    scrollToBlock: async opts => {
      if (opts.blockId !== undefined) {
        console.log(opts)
        await goToBlock(opts.blockId, editor)
        if (opts.highlight) {
          highlightBlock(opts.blockId, editor)
        }
      }
    },
    isSelectionCollapsed: () => {
      const selection = editor.selection
      if (!selection) return false
      if (Range.isCollapsed(selection)) return true
      return false
    },
    save: () => {
      editor.on({ type: 'save', value: editor.children })
    },
    getInsideMetas: () => {
      const eles = editor.children
      const metas = getInsideMetas(eles)
      const ids = new Set<number>()
      Object.values(metas).forEach(o => {
        o.forEach(i => ids.add(i))
      })
      return Array.from(ids.values())
    },
    getHighlightLocation,
    getScrollElement: () => scrollElementRef.current,
    openSetting: () => setEditorBarState(s => ({ ...s, showRightBar: true, rightBarActive: 'setting' })),
    closeSetting: () => setEditorBarState(s => ({ ...s, showRightBar: false })),
    toggleSetting: () =>
      setEditorBarState(s => ({
        ...s,
        showRightBar: s.rightBarActive === 'setting' ? !s.showRightBar : true,
        rightBarActive: 'setting'
      })),
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
      return ID_TO_PATH_MAP.get(editor)?.get(id)
    },
    getOverlayManager: () => {
      return editor.overlayManager
    },
    getSelectedElements: () => {
      const elements = Array.from(instance.values.selectedBlocks.values())
        .map(i => i.element)
        .filter(i => i)
      return elements
    },
    getElementFunctionById: id => {
      return ID_TO_ELEMENTS_MAP.get(editor)?.get(id)
    }
  })
}

export default useEditorInstance
