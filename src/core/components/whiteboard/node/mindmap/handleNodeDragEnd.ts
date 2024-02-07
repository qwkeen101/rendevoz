import { IWhiteboardInstance, IWhiteboardMindmap, IWhiteboardNode } from '~/typings'
import produce from 'immer'
import { install } from 'paper'

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

export const addToTree = (tree: IWhiteboardMindmap, id: number, idx: number, node: IWhiteboardMindmap) => {
  if (tree.root === id) {
    tree.children.splice(idx, 0, node)
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
    const idx = target.children.findIndex(i => {
      const node = instance.getNode?.(i.root)
      if (node) {
        const range = {
          from: node.y - 12,
          to: node.y + node.height! + 12
        }
        if (dragMidY >= range.from && dragMidY <= range.to) {
          return true
        }
      }
      return false
    })
    return idx
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

  // this is reorder
  if (rightIds.has(dragNode.id) || leftIds.has(dragNode.id)) {
    if (rightIds.has(dragNode.id)) {
      // reorder in right tree
      if (link.direction === 'right') {
        const newRightChildren = produce(currNode.rightChildren!, draft => {
          removeFromTree(draft, dragNode.id, n => {
            const idx = findDragIndex(dragNode, { root: currNode.id, children: draft }, link.sourceId, instance)
            console.log(idx)
            if (idx !== undefined && idx >= 0) {
              addToTree({ root: currNode.id, children: draft }, link.sourceId, idx, n)
            }
          })
        })
        console.log(newRightChildren)
        instance.updateWhiteboard?.(w => {
          w.nodes?.set(currNode.id, {
            ...currNode,
            rightChildren: newRightChildren
          })
          const originDragNode = w.nodes?.get(dragNode.id)
          if (originDragNode) {
            w.nodes?.set(originDragNode.id, {
              ...originDragNode,
              rootId: currNode.id,
              side: 'right'
            })
          }
        }, true)
      }
      // drag from right tree to left tree
      if (link.direction === 'left') {
      }
    }
  }
  // this is add to mindmap
  else {
    // add to right tree
    if (link.direction === 'right') {
      const newRightChildren = produce(currNode.rightChildren || [], draft => {
        const idx = findDragIndex(dragNode, { root: currNode.id, children: draft }, link.sourceId, instance)
        console.log(idx)
        if (idx !== undefined && idx >= 0) {
          addToTree({ root: currNode.id, children: draft }, link.sourceId, idx, { root: dragNode.id, children: [] })
        }
      })
      console.log(newRightChildren,dragNode,link)
      instance.updateWhiteboard?.(w => {
        w.nodes?.set(currNode.id, {
          ...currNode,
          rightChildren: newRightChildren
        })
        const originDragNode = w.nodes?.get(dragNode.id)
        if (originDragNode) {
          w.nodes?.set(originDragNode.id, {
            ...originDragNode,
            rootId: currNode.id,
            side: 'right'
          })
        }
      }, true)
    }
  }
}
