import { Store } from 'jotai/vanilla'
import { Draft } from 'immer'
import { IWhiteboardInstance } from '../../types'
import { IWhiteboard, IWhiteboardNode } from '../../types/whiteboard'
import { ensureMap } from '../utils'
import { getBoxOfNodes } from '../../utils'
import { WhiteboardAtom } from '../store'
import { hitTestNode } from '../../utils/hitTest'

const PACK_GAP = 32

export const assignLayoutOps = (
  instance: IWhiteboardInstance,
  store: Store,
  updateWhiteboard: (updater: (draft: Draft<IWhiteboard>) => void, withUndo?: boolean) => Promise<void>
) => {
  instance.layoutOps = {
    packNodes: (nodes?: IWhiteboardNode[]) => {
      const value = store.get(WhiteboardAtom as any) as { nodes?: Map<number, IWhiteboardNode> }
      const candidates = nodes || Array.from(value?.nodes?.values() || [])
      if (!candidates.length) return
      const sorted = [...candidates].sort((a, b) => a.y - b.y || a.x - b.x)
      let cursorX = 0
      let cursorY = 0
      let rowHeight = 0
      const widthLimit = 1200
      const newPositions = new Map<number, { x: number; y: number }>()
      sorted.forEach(node => {
        const width = node.width || 100
        const height = node.height || 60
        if (cursorX + width > widthLimit) {
          cursorX = 0
          cursorY += rowHeight + PACK_GAP
          rowHeight = 0
        }
        newPositions.set(node.id, { x: cursorX, y: cursorY })
        cursorX += width + PACK_GAP
        rowHeight = Math.max(rowHeight, height)
      })
      updateWhiteboard(draft => {
        const map = ensureMap(draft.nodes)
        newPositions.forEach((pos, id) => {
          const n = map.get(id)
          if (n) {
            map.set(id, { ...n, ...pos })
          }
        })
        draft.nodes = map
      }, true)
      instance.nodeOps?.updateRelatedEdges?.(Array.from(newPositions.keys()))
    },
    align: (type, nodes) => {
      const value = store.get(WhiteboardAtom as any) as { nodes?: Map<number, IWhiteboardNode> }
      const selectedIds = instance.selectOps?.getSelectedNodes?.() || []
      const targetNodes =
        nodes && nodes.length
          ? nodes
          : selectedIds.length
            ? selectedIds.map(id => value?.nodes?.get(id)).filter(Boolean) as IWhiteboardNode[]
            : Array.from(value?.nodes?.values() || [])
      if (!targetNodes.length) return
      const box = getBoxOfNodes(targetNodes)
      if (!box) return
      updateWhiteboard(draft => {
        const map = ensureMap(draft.nodes)
        targetNodes.forEach(node => {
          const current = map.get(node.id)
          if (!current) return
          switch (type) {
            case 'left':
              map.set(node.id, { ...current, x: box.left ?? box.x })
              break
            case 'right':
              map.set(node.id, { ...current, x: (box.left ?? box.x) + (box.width - (current.width || 0)) })
              break
            case 'top':
              map.set(node.id, { ...current, y: box.top ?? box.y })
              break
            case 'bottom':
              map.set(node.id, { ...current, y: (box.top ?? box.y) + (box.height - (current.height || 0)) })
              break
            case 'horizontallyCenter':
              map.set(node.id, { ...current, x: (box.left ?? box.x) + box.width / 2 - (current.width || 0) / 2 })
              break
            case 'verticallyCenter':
              map.set(node.id, { ...current, y: (box.top ?? box.y) + box.height / 2 - (current.height || 0) / 2 })
              break
          }
        })
        draft.nodes = map
      }, true)
      instance.nodeOps?.updateRelatedEdges?.(targetNodes.map(n => n.id))
      instance.selectOps?.resetSelectionBox?.()
    },
    distributeSpacing: (direction, nodes) => {
      const value = store.get(WhiteboardAtom as any) as { nodes?: Map<number, IWhiteboardNode> }
      const selectedIds = instance.selectOps?.getSelectedNodes?.() || []
      const targetNodes =
        nodes && nodes.length
          ? nodes
          : selectedIds.length
            ? selectedIds.map(id => value?.nodes?.get(id)).filter(Boolean) as IWhiteboardNode[]
            : Array.from(value?.nodes?.values() || [])
      if (!targetNodes.length) return
      const sorted =
        direction === 'horizontal'
          ? [...targetNodes].sort((a, b) => a.x - b.x)
          : [...targetNodes].sort((a, b) => a.y - b.y)
      if (sorted.length < 3) return
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const span =
        direction === 'horizontal'
          ? (last.x || 0) - (first.x || 0) + (last.width || 0)
          : (last.y || 0) - (first.y || 0) + (last.height || 0)
      const totalSize = sorted.reduce((acc, n) => acc + ((direction === 'horizontal' ? n.width : n.height) || 0), 0)
      const gap = sorted.length > 1 ? (span - totalSize) / (sorted.length - 1) : 0
      updateWhiteboard(draft => {
        const map = ensureMap(draft.nodes)
        let cursor = direction === 'horizontal' ? first.x : first.y
        sorted.forEach((node, idx) => {
          const current = map.get(node.id)
          if (!current) return
          if (idx === 0) {
            cursor = direction === 'horizontal' ? current.x : current.y
          } else {
            cursor += gap
          }
          if (direction === 'horizontal') {
            map.set(node.id, { ...current, x: cursor })
            cursor += current.width || 0
          } else {
            map.set(node.id, { ...current, y: cursor })
            cursor += current.height || 0
          }
        })
        draft.nodes = map
      }, true)
      instance.nodeOps?.updateRelatedEdges?.(targetNodes.map(n => n.id))
      instance.selectOps?.resetSelectionBox?.()
    }
  }
}
