import { IWhiteboardInstance, IWhiteboardMindmap, IWhiteboardNode } from '~/typings'
import produce from 'immer'
import { deleteChildsFromTree, flattenTree, getChildrenOfNode } from '@/core/components/whiteboard/node/mindmap/utils/tree'
import Id from '@/utils/id'

export const removeFromTree = (tree: IWhiteboardMindmap[], id: number, onRemove?: (n: IWhiteboardMindmap) => void) => {
  tree.forEach((t, idx) => {
    if (t.root === id) {
      tree.splice(idx, 1)
      onRemove?.(t)
    } else {
      removeFromTree(t.children, id, onRemove)
    }
  })
}

export const addToTree = (tree: IWhiteboardMindmap, id: number, idx: number | undefined, node: IWhiteboardMindmap) => {
  if (tree.root === id) {
    if (idx === undefined) {
      const length = tree.children.length
      tree.children.splice(length, 0, node)
    } else {
      tree.children.splice(idx, 0, node)
    }
  } else {
    tree.children.forEach(t => {
      addToTree(t, id, idx, node)
    })
  }
}

export const findDragIndex = (
  dragNode: IWhiteboardNode,
  root: { children: IWhiteboardMindmap[]; root: number },
  targetId: number,
  instance: IWhiteboardInstance
) => {
  const findTarget = (t: typeof root) => {
    if (t.root === targetId) {
      return t
    }
    for (const i of t.children) {
      if (i.root === targetId) {
        return i
      }
      const tar = findTarget(i)
      if (tar) {
        return tar
      }
    }
  }
  const target = findTarget(root) as IWhiteboardMindmap | undefined
  if (target) {
    const dragMidY = dragNode.y + dragNode.height! / 2
    if (!target.children.length) {
      return 0
    }
    const first = target.children[0]
    const last = target.children[target.children.length - 1]
    const firstNode = instance.getNode?.(first.root)
    if (firstNode && dragMidY < firstNode.y + firstNode.height! / 2) return 0
    const lastNode = instance.getNode?.(last.root)
    if (lastNode && dragMidY > lastNode.y + lastNode.height! / 2) {
      return target.children.length
    }
    const idx = target.children.findLastIndex((i, idx) => {
      const node = instance.getNode?.(i.root)
      if (node) {
        const mid = node.y + node.height! / 2
        console.log(mid, dragNode, dragMidY, idx)
        if (dragMidY > mid) {
          return true
        }
      }
      return false
    })
    if (idx >= 0) {
      return idx + 1
    }
    return -1
  }
}

export const findSubChildren = (children: IWhiteboardMindmap[], id: number): IWhiteboardMindmap[] | undefined => {
  for (const c of children) {
    if (c.root === id) {
      return c.children
    }
    const result = findSubChildren(c.children, id)
    if (result) {
      return result
    }
  }
}
export default (result: {
  dragNode: IWhiteboardNode
  currNode: IWhiteboardNode & { type: 'mindmap' }
  link: { sourceId: number; targetId: number; direction: 'left' | 'right' }
  rightIds: Set<number>
  instance: IWhiteboardInstance
  leftIds: Set<number>
}) => {
  const { dragNode, link, rightIds, leftIds, currNode, instance } = result
  let childrenNodes: IWhiteboardMindmap[] = []
  if (dragNode.type === 'mindmap') {
    childrenNodes = [...(getChildrenOfNode(dragNode, instance, 'left') || []), ...(getChildrenOfNode(dragNode, instance, 'right') || [])]
  } else {
    childrenNodes = getChildrenOfNode(dragNode, instance) || []
  }
  const currN = {
    ...currNode
  }
  const dragAttachTarget = instance.getNode?.(link.sourceId === dragNode.id ? link.targetId : link.sourceId)
  const targetCollapse =
    dragAttachTarget?.type === 'mindmap'
      ? dragAttachTarget[link.direction === 'right' ? 'rightCollapse' : 'leftCollapse']
      : dragAttachTarget?.collapseChildren
  // this is reorder, first remove from tree
  const deletedMindmaps: Record<number, IWhiteboardMindmap> = {}
  if (rightIds.has(dragNode.id) || leftIds.has(dragNode.id)) {
    if (rightIds.has(dragNode.id) && currN.rightChildren) {
      const res = deleteChildsFromTree(currN.rightChildren, dragNode.id)
      currN.rightChildren = res.result
      res.deletedNodes.forEach(n => {
        deletedMindmaps[n.root] = n
      })
    }
    if (leftIds.has(dragNode.id) && currN.leftChildren) {
      const res = deleteChildsFromTree(currN.leftChildren, dragNode.id)
      currN.leftChildren = res.result
      res.deletedNodes.forEach(n => {
        deletedMindmaps[n.root] = n
      })
    }
  }
  const newChildren = produce(currN[link.direction === 'right' ? 'rightChildren' : 'leftChildren'] || [], draft => {
    const idx = findDragIndex(dragNode, { root: currNode.id, children: draft }, link.sourceId, instance)
    if (idx !== undefined && idx >= 0) {
      addToTree({ root: currNode.id, children: draft }, link.sourceId, idx, {
        ...deletedMindmaps[dragNode.id],
        root: dragNode.id,
        children: childrenNodes
      })
    }
  })
  console.log(currN, newChildren)
  instance.updateWhiteboard?.(w => {
    // update curr mindmap
    w.nodes?.set(currNode.id, {
      ...currN,
      [link.direction === 'right' ? 'rightChildren' : 'leftChildren']: newChildren
    })
    const originDragNode = w.nodes?.get(dragNode.id)
    if (originDragNode && originDragNode.type === 'mindmap') {
      w.nodes?.set(originDragNode.id, {
        ...originDragNode,
        type: originDragNode.type === 'mindmap' ? originDragNode.nodeType || 'text' : originDragNode.type,
        rootId: currNode.id,
        content: originDragNode.content ?? [{ type: 'paragraph', children: [{ text: '' }], id: Id.getId() }],
        rightChildren: [],
        leftChildren: [],
        collapse: targetCollapse ? dragAttachTarget?.id : false,
        side: link.direction
      })
    }
    const finalChildrenNodesOfMindmap = [...flattenTree(currN[link.direction === 'right' ? 'rightChildren' : 'leftChildren'] || [])]
    finalChildrenNodesOfMindmap.forEach(n => {
      const origin = w.nodes?.get(n.root)
      if (origin) {
        w.nodes?.set(origin.id, {
          ...origin,
          rootId: currN.id,
          side: link.direction
        })
      }
    })
    if (originDragNode) {
      w.nodes?.set(originDragNode.id, {
        ...w.nodes.get(originDragNode.id)!,
        rootId: currN.id,
        collapse: targetCollapse ? dragAttachTarget?.id : false,
        side: link.direction,
        border: currN.border,
        borderType: currN.borderType
      })
    }
  }, true)
}
