import { Store } from 'jotai/vanilla'
import { IWhiteboardInstance, IWhiteboardNode } from '../../types'
import { WhiteboardAtom } from '../store'
import { boxContain, getBoxOfNodes } from '../../utils'

const getGroupBox = (node: IWhiteboardNode) => {
  const width = node.width ?? 0
  const height = node.height ?? 0
  if (!width && !height) return
  return {
    left: node.x,
    top: node.y,
    width,
    height
  }
}

const enlargeBox = (box: { left?: number; top?: number; width?: number; height?: number }, padding = 36) => ({
  left: (box.left ?? box.x ?? 0) - padding,
  top: (box.top ?? box.y ?? 0) - padding,
  width: (box.width ?? 0) + padding * 2,
  height: (box.height ?? 0) + padding * 2
})

export const assignGroupOps = (instance: IWhiteboardInstance, store: Store) => {
  instance.groupOps = {
    getParentGroupsOfNode: (nodeId, mindmapChildUseRoot = false) => {
      const value = store.get(WhiteboardAtom as any)
      const target = value.nodes?.get(nodeId)
      if (!target) return []
      const targetBox = {
        left: target.x,
        top: target.y,
        width: target.width ?? 0,
        height: target.height ?? 0
      }
      const rootBox =
        mindmapChildUseRoot && target.rootId ? (() => {
          const root = value.nodes?.get(target.rootId!)
          if (!root) return
          return {
            left: root.x,
            top: root.y,
            width: root.width ?? 0,
            height: root.height ?? 0
          }
        })() : undefined

      return Array.from(value.nodes?.values() || []).filter(n => {
        if (n.type !== 'group' || n.id === nodeId) return false
        const groupBox = getGroupBox(n)
        if (!groupBox) return false
        return boxContain(groupBox, targetBox) || (rootBox ? boxContain(groupBox, rootBox) : false)
      })
    },
    getNodesInGroup: (groupId, includeSelf = false, mindmapChildUseRoot = false) => {
      const value = store.get(WhiteboardAtom as any)
      const group = value.nodes?.get(groupId)
      if (!group) return []
      const groupBox = getGroupBox(group)
      if (!groupBox) return []
      return Array.from(value.nodes?.values() || []).filter(n => {
        if (!includeSelf && n.id === groupId) return false
        if (n.id === groupId) return true
        const baseBox = (() => {
          if (n.rootId && mindmapChildUseRoot) {
            const root = value.nodes?.get(n.rootId)
            if (root) {
              return {
                left: root.x,
                top: root.y,
                width: root.width ?? 0,
                height: root.height ?? 0
              }
            }
          }
          return {
            left: n.x,
            top: n.y,
            width: n.width ?? 0,
            height: n.height ?? 0
          }
        })()
        return boxContain(groupBox, baseBox)
      })
    },
    groupNodes: nodeIds => {
      const ids = Array.isArray(nodeIds) ? nodeIds : [nodeIds]
      const value = store.get(WhiteboardAtom as any)
      const nodes = ids.map(id => value.nodes?.get(id)).filter(Boolean) as IWhiteboardNode[]
      const box = getBoxOfNodes(nodes)
      if (!box) return
      const enlarged = enlargeBox(box)
      instance.insertNode?.({
        type: 'group',
        x: enlarged.left ?? 0,
        y: enlarged.top ?? 0,
        width: enlarged.width ?? 0,
        height: enlarged.height ?? 0
      })
    }
  }
}

export { enlargeBox }
