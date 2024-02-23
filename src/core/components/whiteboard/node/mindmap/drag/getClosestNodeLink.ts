import { IWhiteboardInstance, IWhiteboardMindmap, IWhiteboardNode } from '~/typings'
import produce from 'immer'
import { getBoxOfBoxes, getBoxOfNodes } from '@/core/components/whiteboard/utils'
import { getSubChildren, getChildrenOfNode } from '../utils/tree'
const middleSpacing = 100
const xSpacing = 300
// 垂直方向的间隔
const columnSpacing = 25
// 垂直方向最远的距离
const maxColumnSpacing = 100
// 脑图父节点和子节点之间的间隔, 水平的
const parentChildSpacing = 150
const checkY = (midY: number, node: IWhiteboardNode) => {
  if (midY >= node.y - columnSpacing && midY <= node.y + node.height + columnSpacing) {
    return true
  }
  return false
}
// 检查x方向上符合的节点
// 右树：拖动节点的left应该小于任意子节点的的right，如果大于某个子节点的right，则失败，如果都小于，则成功
// 左树：拖动节点的right应该小于节点的left
const checkX = (
  direction: 'right' | 'left',
  dragNode: IWhiteboardNode,
  node: IWhiteboardNode & { type: 'mindmap' },
  children: IWhiteboardMindmap[] | undefined,
  instance: IWhiteboardInstance
) => {
  const dragNodeRight = dragNode.x + dragNode.width!
  const nodeRight = node.x + node.width!
  if (direction === 'right') {
    // 有右子节点，需要小于parentChildSpacing
    if (children?.length) {
      // 如果有任意子节点超过，则失败
      if (
        children.some(c => {
          const cBox = instance.nodeOps?.getNodeFuncs(c.root)?.getRealtimeBox()
          if (cBox) {
            if (dragNode.x > cBox.left + cBox.width) {
              return true
            }
          }
        })
      ) {
        return false
      }
      if (dragNode.x - nodeRight <= xSpacing) {
        return true
      }
      return false
    }
    // 无右子节点，小于xSpacing即可
    if (dragNode.x - nodeRight <= xSpacing) {
      return true
    }
    return false
  }
  if (direction === 'left') {
    // 有子节点
    if (children?.length) {
      if (
        children.some(c => {
          const cBox = instance.nodeOps?.getNodeFuncs(c.root)?.getRealtimeBox()
          if (cBox) {
            if (dragNodeRight < cBox.left) {
              return true
            }
          }
        })
      ) {
        return false
      }
      if (Math.abs(dragNodeRight - node.x) <= xSpacing) {
        return true
      }
      return false
    }
    // 无子节点，小于xSpacing
    if (Math.abs(dragNodeRight - node.x) <= xSpacing) {
      return true
    }
    return false
  }
}
export default (currentNode: IWhiteboardNode, instance: IWhiteboardInstance, e: PointerEvent) => {
  // 组不能成为导图节点
  if (currentNode.type === 'group') {
    return
  }
  const transformed = instance.coordOps?.transformWindowPositionToPosition({ x: e.clientX, y: e.clientY })
  const currentNodeBox = {
    left: currentNode.x,
    top: currentNode.y,
    width: currentNode.width!,
    height: currentNode.height!
  }
  if (!currentNodeBox) return
  if (transformed) {
    const allNodes = instance.getAllNode?.()

    // 可以贴近的节点
    const attachableNodes = allNodes?.filter(i => (i.type === 'mindmap' || i.rootId) && !i.collapse && i.id !== currentNode.id)
    const midX = currentNodeBox.left + currentNodeBox.width / 2
    const midY = currentNodeBox.top + currentNodeBox.height / 2
    const right = currentNodeBox.left + currentNodeBox.width

    // 思维导图节点应该根据它的子节点扩展高度
    if (attachableNodes?.length) {
      const expanded = attachableNodes.map(ni => {
        const nodeBox = instance.nodeOps?.getNodeFuncs(ni.id)?.getRealtimeBox()
        if (!nodeBox) return ni
        const n = {
          ...ni,
          x: nodeBox.left,
          y: nodeBox.top,
          width: nodeBox.width,
          height: nodeBox.height
        }
        // todo: should get all nested subchildren
        if (n.type === 'mindmap' || n.rootId) {
          let rightBox = undefined
          let leftBox = undefined
          if (n.type === 'mindmap') {
            const rightChildren = n.rightChildren
            const leftChildren = n.leftChildren
            if (rightChildren?.length && !n.rightCollapse) {
              rightBox = getBoxOfBoxes(Object.values(instance.nodeOps?.getDOMBoxOfNodes(rightChildren.map(i => i.root)) || {}))
            }
            if (leftChildren?.length && !n.rightCollapse) {
              leftBox = getBoxOfBoxes(Object.values(instance.nodeOps?.getDOMBoxOfNodes(leftChildren.map(i => i.root)) || {}))
            }
            console.log(rightBox, leftBox, n)
          }
          if (n.rootId && !n.collapseChildren) {
            const children = getChildrenOfNode(n, instance, n.side)
            if (children?.length) {
              const box = getBoxOfBoxes(Object.values(instance.nodeOps?.getDOMBoxOfNodes(children.map(i => i.root)) || {}))
              n.side === 'right' ? (rightBox = box) : (leftBox = box)
            }
          }
          // 如果指针在此节点右侧，则通过rightbox扩展， 在左侧则通过leftbox扩展
          let minY = nodeBox.top
          let maxY = nodeBox.top + nodeBox.height
          if (rightBox) {
            minY = Math.min(rightBox.top, minY)
            maxY = Math.max(rightBox.top + rightBox.height, maxY)
          }
          if (leftBox) {
            minY = Math.min(minY, leftBox.top)
            maxY = Math.max(leftBox.top + leftBox.height, maxY)
          }
          n.y = minY
          n.height = maxY - minY
        }
        return n
      })
      // 垂直方向上可用的节点
      const yAvailableNodes = expanded.filter(i => {
        const top = i.y - middleSpacing
        const bottom = i.y + i.height! + middleSpacing
        if (midY >= top && midY <= bottom) {
          return true
        }
        return false
      })
      // sort by x, from left to right
      console.log(yAvailableNodes, expanded)
      yAvailableNodes.sort((b, a) => b.x - a.x)
      // 可用节点的x值
      const xAvailableNodes: {
        node: IWhiteboardNode
        direction: 'left' | 'right'
      }[] = []
      // 这里判断在x上符合的节点，分两种，根节点和子节点，根节点可以有左右，子节点只能在它那个方向创建
      yAvailableNodes.forEach(n => {
        const nRight = n.width! + n.x
        // 子节点
        if ('side' in n && n.side) {
          if (n.side === 'right') {
            // 拖动节点的左边要在本节点的右边的右侧
            if (currentNode.x >= nRight) {
              const subChildren = getChildrenOfNode(n, instance, 'right')
              if (checkX('right', currentNode, n, n.collapseChildren ? [] : subChildren, instance)) {
                xAvailableNodes.push({
                  node: n,
                  direction: 'right'
                })
              }
            }
          }
          if (n.side === 'left') {
            // 拖动节点的右边要在本节点的左边的左侧
            if (right <= n.x) {
              const subChildren = getChildrenOfNode(n, instance, 'left')
              if (checkX('left', currentNode, n, n.collapseChildren ? [] : subChildren, instance)) {
                xAvailableNodes.push({
                  node: n,
                  direction: 'left'
                })
              }
            }
          }
        }
        // 根节点
        else {
          if (midX >= n.x + n.width! / 2) {
            const subChildren = n.rightCollapse ? [] : getChildrenOfNode(n, instance, 'right')
            if (checkX('right', currentNode, n, subChildren, instance)) {
              xAvailableNodes.push({
                node: n,
                direction: 'right'
              })
            }
          } else {
            const subChildren = n.leftCollapse ? [] : getChildrenOfNode(n, instance, 'left')
            if (checkX('left', currentNode, n, subChildren, instance)) {
              xAvailableNodes.push({
                node: n,
                direction: 'left'
              })
            }
          }
        }
      })

      if (xAvailableNodes.length) {
        //从上到下排列
        xAvailableNodes.sort((b, a) => b.node.y - a.node.y)
        const target = xAvailableNodes.find((i, idx, arr) => {
          if (idx == 0) {
            if (midY < i.node.y && i.node.y - midY < maxColumnSpacing) {
              return true
            }
          }
          if (idx === arr.length - 1) {
            const bottom = i.node.y + i.node.height
            if (midY > bottom && midY - bottom < maxColumnSpacing) {
              return true
            }
          }
          if (checkY(midY, i.node)) {
            return true
          }
          return false
        })
        if (target) {
          return target
        }
      }
    }
  }
}
