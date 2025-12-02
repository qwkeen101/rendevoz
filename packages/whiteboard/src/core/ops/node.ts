import { Store } from 'jotai/vanilla'
import { ensureMap } from '../utils'
import { IWhiteboardInstance } from '../../types'
import { IWhiteboard, IWhiteboardNode } from '../../types/whiteboard'
import { WhiteboardAtom } from '../store'
import { Draft } from 'immer'
import { getBoxOfNodes, hitTestNode, boxesIntersect } from '../../utils'
import { enlargeBox } from './group'

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
      if (toDelete.length) {
        instance.emit?.({ type: 'nodeDeleted', deleted: toDelete })
      }
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
    open: () => undefined,
    getNodeDOM: nodeId => {
      return instance.values.NODE_DOM_MAP?.get(nodeId) ?? null
    },
    getDOMBoxOfNodes: nodeIds => {
      const rects = nodeIds
        .map(id => instance.values.NODE_DOM_MAP?.get(id)?.getBoundingClientRect())
        .filter(Boolean) as DOMRect[]

      if (!rects.length) return null

      // Calculate merged bounding box in window coordinates
      const left = Math.min(...rects.map(r => r.left))
      const top = Math.min(...rects.map(r => r.top))
      const right = Math.max(...rects.map(r => r.right))
      const bottom = Math.max(...rects.map(r => r.bottom))

      // Convert back to whiteboard coordinates
      const transform = instance.coordOps?.getTransform?.()
      const containerRect = instance.getOutestContainerNode?.()?.getBoundingClientRect()

      if (!transform || !containerRect) {
        // Fallback: return window coordinates if transform is unavailable
        return {
          x: left,
          y: top,
          left,
          top,
          width: right - left,
          height: bottom - top
        }
      }

      const whiteboardLeft = (left - containerRect.left - transform.x) / transform.scale
      const whiteboardTop = (top - containerRect.top - transform.y) / transform.scale

      return {
        x: whiteboardLeft,
        y: whiteboardTop,
        left: whiteboardLeft,
        top: whiteboardTop,
        width: (right - left) / transform.scale,
        height: (bottom - top) / transform.scale
      }
    },
    extendNodes: nodes => {
      const list = Array.isArray(nodes) ? nodes : [nodes]
      const normalized =
        typeof list[0] === 'number'
          ? (list as number[]).map(id => instance.getNode?.(id)).filter(Boolean) as IWhiteboardNode[]
          : (list as IWhiteboardNode[])
      const nodeSet = new Set<IWhiteboardNode>(normalized)
      normalized
        .filter(n => n.type === 'group')
        .forEach(g => {
          instance.groupOps?.getNodesInGroup?.(g.id)?.forEach(n => nodeSet.add(n))
        })
      return Array.from(nodeSet.values())
    },
    intersectWith: (nodeId, box) => {
      const node = instance.getNode?.(nodeId)
      if (!node) return false
      const nodeBox = {
        left: node.x,
        top: node.y,
        width: node.width ?? 0,
        height: node.height ?? 0
      }
      return boxesIntersect(nodeBox, box)
    },
    fitContent: ids => {
      const list = Array.isArray(ids) ? ids : [ids]
      updateWhiteboard(draft => {
        const nodes = ensureMap(draft.nodes)
        list.forEach(id => {
          const node = nodes.get(id)
          if (!node) return
          if (node.type === 'group') {
            const inside = instance.groupOps?.getNodesInGroup?.(id, false, true) || []
            const box = getBoxOfNodes(inside as any)
            if (!box) return
            const enlarged = enlargeBox(box)
            nodes.set(id, {
              ...node,
              x: enlarged.left ?? 0,
              y: enlarged.top ?? 0,
              width: enlarged.width ?? 0,
              height: enlarged.height ?? 0
            })
          } else {
            nodes.set(id, { ...node, resized: false, fixedExpanded: false })
          }
        })
        draft.nodes = nodes
      }, true)
      instance.selectOps?.resetSelectionBox?.()
    }
  }
}
