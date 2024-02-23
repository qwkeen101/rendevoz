import { IWhiteboardInstance, IWhiteboardMindmap, IWhiteboardNode } from '~/typings'
import produce from 'immer'

export const deleteChildsFromTree = (tree: IWhiteboardMindmap[], deleteNodeIds: number | number[]) => {
  const deleteIdSet = new Set(Array.isArray(deleteNodeIds) ? deleteNodeIds : [deleteNodeIds])
  const deletedNodes: IWhiteboardMindmap[] = []
  const traverse = (node: IWhiteboardMindmap) => {
    if (!node.children.length) return node.children
    let newChildren = node.children.filter(i => {
      if (deleteIdSet.has(i.root)) {
        deletedNodes.push(i)
        return false
      }
      return true
    })
    newChildren = newChildren.map(c => ({ root: c.root, children: traverse(c) }))
    return newChildren
  }
  const root = {
    children: tree,
    root: 0
  }
  return {
    result: traverse(root),
    deletedNodes
  }
}

export const getSubChildren = (root: IWhiteboardMindmap, id: number): IWhiteboardMindmap[] | undefined => {
  if (root.root === id) return root.children
  for (const c of root.children) {
    if (c.root === id) {
      return c.children
    }
    const result = getSubChildren(c, id)
    if (result) {
      return result
    }
  }
}
export const flattenTree = (children: IWhiteboardMindmap[]) => {
  const nodes: IWhiteboardMindmap[] = []
  const loop = (c: IWhiteboardMindmap) => {
    nodes.push(c)
    c.children.forEach(i => loop(i))
  }
  children.forEach(c => loop(c))
  return nodes
}
export const getFlattenChildrenOfNode = (node: IWhiteboardNode, instance: IWhiteboardInstance, direction?: 'right' | 'left') => {
  const children = getChildrenOfNode(node, instance, direction)
  if (children) {
    return flattenTree(children)
  }
}
export const getChildrenOfNode = (node: IWhiteboardNode, instance: IWhiteboardInstance, direction?: 'right' | 'left') => {
  if (node.type === 'mindmap') {
    if (direction === 'right') {
      return node.rightChildren
    }
    return node.leftChildren
  }
  if (node.rootId) {
    const root = instance.getNode?.(node.rootId)
    if (root && root.type === 'mindmap') {
      return getSubChildren({ root: root.id, children: root[node.side === 'left' ? 'leftChildren' : 'rightChildren'] || [] }, node.id)
    }
  }
}

export const getSiblingNodesOfNode = (node: IWhiteboardNode, instance: IWhiteboardInstance) => {
  if (!node.rootId) {
    return
  }
  const root = instance.getNode?.(node.rootId)
  if (root && root.type === 'mindmap') {
    const rootNodes = node.side === 'right' ? root.rightChildren : root.leftChildren
    if (rootNodes) {
      let ns: undefined | IWhiteboardMindmap[] = undefined
      const loop = (nodes: IWhiteboardMindmap[]) => {
        if (nodes.some(i => i.root === node.id)) {
          ns = nodes
          return true
        }
        nodes.find(n => loop(n.children))
      }
      loop(rootNodes)
      return ns
    }
  }
}

export const getParentNodeOfNode = (node: IWhiteboardNode, instance: IWhiteboardInstance) => {
  if (!node.rootId) {
    return
  }
  const root = instance.getNode?.(node.rootId)
  if (root && root.type === 'mindmap') {
    const rootNodes = node.side === 'right' ? root.rightChildren : root.leftChildren
    if (rootNodes) {
      if (rootNodes.some(i => i.root === node.rootId)) {
        return {
          id: root.id,
          children: rootNodes
        }
      }
      let ns: undefined | IWhiteboardMindmap = undefined
      const loop = (nodes: IWhiteboardMindmap[]) => {
        const target = nodes.find(i => i.children.some(c => c.root === node.id))
        if (target) {
          ns = target
          return
        }
        nodes.find(n => loop(n.children))
      }
      loop(rootNodes)
      if (ns) {
        return {
          id: ns.root,
          children: ns.children
        }
      }
    }
  }
}
