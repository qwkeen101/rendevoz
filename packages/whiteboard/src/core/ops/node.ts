import { Store } from 'jotai/vanilla'
import { ensureMap } from '../utils'
import { IWhiteboardInstance } from '../../types'
import { IWhiteboard, IWhiteboardNode } from '../../types/whiteboard'
import { WhiteboardAtom } from '../store'
import { Draft } from 'immer'
import { hitTestNode } from '../../utils'

export const assignNodeOps = (
  instance: IWhiteboardInstance,
  store: Store,
  updateWhiteboard: (updater: (draft: Draft<IWhiteboard>) => void, withUndo?: boolean) => Promise<void>
) => {
  instance.nodeOps = {
    selectNode: id => {
      instance.selectOps?.setSelection?.({ nodes: new Set([id]), edges: new Set() })
    },
    deselectAll: () => instance.selectOps?.clear?.(),
    hitTest: point => {
      const nodes = instance.getAllNode?.() || []
      return hitTestNode(point, nodes)
    },
    getMaxZindex: () => {
      const nodes = instance.getAllNode?.() || []
      const zs = nodes.map(n => n.z).filter(i => i !== undefined) as number[]
      return Math.max(...zs, 0)
    },
    updateAfterZ: currentNodeId => {
      const node = instance.getNode?.(currentNodeId)
      if (!node) return
      const nodes = instance.getAllNode?.() || []
      const after = nodes.filter(n => n.z > node.z)
      if (!after.length) return
      const maxZ = Math.max(...after.map(n => n.z), 0)
      updateWhiteboard(draft => {
        const map = ensureMap(draft.nodes)
        after.forEach(n => {
          map.set(n.id, { ...n, z: n.z - 1 })
        })
        map.set(node.id, { ...node, z: maxZ })
        draft.nodes = map
      }, true)
    },
    deleteNodes: ids => {
      const toDelete = Array.isArray(ids) ? ids : [ids]
      updateWhiteboard(draft => {
        const nodes = ensureMap(draft.nodes)
        const edges = ensureMap(draft.edges)
        toDelete.forEach(id => {
          nodes.delete(id)
          edges.forEach((edge, edgeId) => {
            if (edge.sourceId === id || edge.targetId === id) {
              edges.delete(edgeId)
            }
          })
        })
        draft.nodes = nodes
        draft.edges = edges
      }, true)
    },
    canExpand: () => false,
    expand: () => undefined,
    updateRelatedEdges: nodeIds => {
      const nodes = Array.isArray(nodeIds) ? nodeIds : [nodeIds]
      const value = store.get(WhiteboardAtom)
      const edges = ensureMap(value.edges)
      nodes.forEach(id => {
        const related = Array.from(edges.values()).filter(e => e.sourceId === id || e.targetId === id)
        instance.values.NODE_TO_EDGE_MAP?.set(
          id,
          new Set(
            related.map(e => e.id)
          )
        )
      })
    },
    getNodeFuncs: () => undefined,
    open: () => undefined
  }
}
