import { Store } from 'jotai/vanilla'
import { WhiteboardSelectionAtom } from '../store'
import { IWhiteboardInstance, WhiteboardSelection } from '../../types'

export const assignSelectionOps = (instance: IWhiteboardInstance, store: Store) => {
  const setSelection = (sel: WhiteboardSelection) => store.set(WhiteboardSelectionAtom, sel)
  const getSelection = () => store.get(WhiteboardSelectionAtom)

  instance.selectOps = {
    getSelection,
    setSelection,
    selectNode: (id, append = false) => {
      const current = getSelection()
      const next: WhiteboardSelection = {
        nodes: append ? new Set(current.nodes) : new Set(),
        edges: append ? new Set(current.edges) : new Set()
      }
      next.nodes.add(id)
      setSelection(next)
    },
    selectEdge: (id, append = false) => {
      const current = getSelection()
      const next: WhiteboardSelection = {
        nodes: append ? new Set(current.nodes) : new Set(),
        edges: append ? new Set(current.edges) : new Set()
      }
      next.edges.add(id)
      setSelection(next)
    },
    clear: () => setSelection({ nodes: new Set(), edges: new Set() }),
    resetSelectionBox: () => setSelection({ nodes: getSelection().nodes, edges: getSelection().edges }),
    getSelectedNodes: () => Array.from(getSelection().nodes),
    getSelectedEdges: () => Array.from(getSelection().edges)
  }
}
