import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { flextree, FlextreeNode } from 'd3-flextree'
import { getBoxOfNodes } from '@/core/components/whiteboard/utils'

export default (node: IWhiteboardNode & { type: 'mindmap' }, instance: IWhiteboardInstance, direction: 'right' | 'left') => {
  const children = direction === 'right' ? node.rightChildren : node.leftChildren
  const normalized = {
    ...node,
    root: node.id,
    children
  }
  const layout = flextree({
    nodeSize: n => {
      const id = n.data.root
      const size = instance.getNode?.(id)
      if (!size || size.width === undefined || size.height === undefined) return [0, 0]
      let height = size.height
      const descendants = n.descendants()
      console.log(descendants)
      if (descendants.length) {
        const descendantsNodes = descendants.map(i => instance.getNode?.(i.data.root)).filter(i => i)
        let initial = 0
        descendantsNodes.forEach(n => {
          if (n?.height) {
            initial += n.height + 24
          }
        })
        initial -= 24
        height = initial
      }
      return [height, size.width]
    },
    spacing: 24
  })
  const tree = layout.hierarchy(normalized)
  layout(tree)
  return transformLayout(tree, 'r')
}

const transformLayout = (root: FlextreeNode<any>, direction: 'r' | 'l') => {
  if (direction === 'r') {
    const ns = root.nodes.map(n => {
      return {
        x: n.y + n.depth * 100,
        y: n.x,
        id: n.data.root
      }
    })
    return ns
  }
  if (direction === 'l') {
  }
}
