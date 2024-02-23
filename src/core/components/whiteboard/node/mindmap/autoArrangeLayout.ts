import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { flextree, FlextreeNode } from 'd3-flextree'
import { getBoxOfNodes } from '@/core/components/whiteboard/utils'
import Hierarchy from '@antv/hierarchy'

export default (node: IWhiteboardNode & { type: 'mindmap' }, instance: IWhiteboardInstance, direction: 'right' | 'left') => {
  const children = direction === 'right' ? node.rightChildren : node.leftChildren
  if (direction === 'right' && node.rightCollapse) return
  if (direction === 'left' && node.leftCollapse) return
  const normalized = {
    ...node,
    root: node.id,
    children
  }
  const rootNode = Hierarchy.mindmap(normalized, {
    getSide(d) {
      return direction
    },
    direction: 'H',
    getHeight: d => {
      const id = d.root
      const size = instance.nodeOps?.getNodeFuncs?.(id)?.getRealtimeBox()
      return size?.height ?? 0
    },
    getWidth: d => {
      const id = d.root
      const size = instance.nodeOps?.getNodeFuncs?.(id)?.getRealtimeBox()
      return size?.width ?? 0
    },
    getHGap: () => 100,
    getVGap: () => 12,
    getSubTreeSep(d) {
      return 0
      // if (!d.children || !d.children.length) {
      //   return 0
      // }
      // return 40
    }
  })
  const nodes = []
  rootNode.eachNode(n => {
    nodes.push({
      id: n.data.root,
      x: n.x - rootNode.x,
      y: n.y - rootNode.y
    })
  })
  // const layout = flextree({
  //   children: n => {
  //     const id = n.root
  //     const node = instance.getNode?.(id)
  //     if (node?.collapse) {
  //       return undefined
  //     }
  //     if (node?.collapseChildren) {
  //       return undefined
  //     }
  //     return n.children
  //   },
  //   nodeSize: n => {
  //     const id = n.data.root
  //     const size = instance.nodeOps?.getNodeFuncs?.(id)?.getRealtimeBox()
  //     return [size?.height ?? 0, size?.width ?? 0]
  //   },
  //   spacing: 24
  // })
  // const tree = layout.hierarchy(normalized)
  // layout(tree)
  // return transformLayout(tree, direction === 'right' ? 'r' : 'l')
  return nodes
}

const transformLayout = (root: FlextreeNode<any>, direction: 'r' | 'l') => {
  if (direction === 'r') {
    const ns = root.nodes.map(n => {
      return {
        x: n.y + n.depth * 150,
        y: n.x,
        id: n.data.root
      }
    })
    return ns
  }
  if (direction === 'l') {
    const ns = root.nodes.map(n => {
      return {
        x: -n.y + root.size[1] + n.depth * -150,
        y: n.x,
        id: n.data.root
      }
    })
    return ns
  }
}
