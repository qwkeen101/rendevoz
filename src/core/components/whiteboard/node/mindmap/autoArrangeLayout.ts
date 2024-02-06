import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { flextree, FlextreeNode } from 'd3-flextree'
const test = {
  id: '0',
  size: {
    width: 100,
    height: 200
  },
  children: [
    {
      size: {
        width: 100,
        height: 200
      },
      id: '0-0',
      children: [
        {
          id: '0-0-0',
          size: {
            width: 100,
            height: 200
          }
        }
      ]
    },
    {
      size: {
        width: 100,
        height: 200
      },
      id: '0-1'
    }
  ]
}
export default (node: IWhiteboardNode & { type: 'mindmap' }, instance: IWhiteboardInstance) => {
  // const nodesMap = new Map(instance.getAllNode?.().map(i => [i.id, i]))
  // const children = node.children
  const layout = flextree({
    nodeSize: n => [n.data.size.height, n.data.size.width]
  })
  const tree = layout.hierarchy(test)
  layout(tree)
  console.log(transformLayout(tree, 'r'))
}

const transformLayout = (root: FlextreeNode<any>, direction: 'r' | 'l') => {
  if (direction === 'r') {
    const ns = root.nodes.map(n => {
      return {
        x: n.y,
        y: n.x,
        id: n.data.id
      }
    })
    return ns
  }
  if (direction === 'l') {
  }
}
