import { IWhiteboardInstance, IWhiteboardMindmap, IWhiteboardNode } from '../../types'

const collectMindmapNodes = (trees: IWhiteboardMindmap[] | undefined, lookup: (id: number) => IWhiteboardNode | undefined) => {
  const result: IWhiteboardNode[] = []
  if (!trees) return result
  const walk = (nodes: IWhiteboardMindmap[]) => {
    nodes.forEach(n => {
      const node = lookup(n.root)
      if (node) result.push(node)
      if (n.children?.length) walk(n.children)
    })
  }
  walk(trees)
  return result
}

export const assignMindmapOps = (instance: IWhiteboardInstance) => {
  instance.mindmapOps = {
    updateMindmapEdges: () => {
      /* Placeholder: rendering layer should handle edge redraw if needed */
    },
    expandMindmap: node => {
      if (!node) return []
      const children: IWhiteboardNode[] = []
      const lookup = (id: number) => instance.getNode?.(id)
      children.push(...collectMindmapNodes(node.rightChildren, lookup))
      children.push(...collectMindmapNodes(node.leftChildren, lookup))
      return children
    }
  }
}
