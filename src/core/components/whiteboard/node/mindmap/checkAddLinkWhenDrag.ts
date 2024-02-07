import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import produce from 'immer'
import { getBoxOfNodes } from '@/core/components/whiteboard/utils'
import { findSubChildren } from '@/core/components/whiteboard/node/mindmap/handleNodeDragEnd'

const middleSpacing = 100
const xSpacing = 200
// 垂直方向的间隔
const columnSpacing = 25
// 脑图父节点和子节点之间的间隔, 水平的
const parentChildSpacing = 100
const checkY = (midY: number, node: IWhiteboardNode) => {
  if (midY >= node.y - columnSpacing && midY <= node.y + node.height + columnSpacing) {
    return true
  }
  return false
}

const checkX = (direction: 'right' | 'left', dragNode: IWhiteboardNode, node: IWhiteboardNode & { type: 'mindmap' }) => {
  if (direction === 'right') {
    // 有右子节点，需要小于parentChildSpacing
    if (node.rightChildren?.length) {
      if (dragNode.x - (node.x + node.width!) <= parentChildSpacing) {
        return true
      }
      return false
    }
    // 无右子节点，小于xSpacing即可
    if (dragNode.x - (node.x + node.width!) <= xSpacing) {
      return true
    }
    return false
  }
  if (direction === 'left') {
    if (node.leftChildren?.length) {
      if (Math.abs(dragNode.x + dragNode.width! - node.x) <= parentChildSpacing) {
        return true
      }
      return false
    }
    if (Math.abs(dragNode.x + dragNode.width! - node.x) <= xSpacing) {
      return true
    }
    return false
  }
}
export default (currentNode: IWhiteboardNode, instance: IWhiteboardInstance, e: PointerEvent) => {
  const transformed = instance.coordOps?.transformWindowPositionToPosition({ x: e.clientX, y: e.clientY })
  if (currentNode.width === undefined || currentNode.height === undefined) return
  if (transformed) {
    const allNodes = instance.getAllNode?.()
    const nodesMap = new Map(allNodes?.map(i => [i.id, i]))
    const nestedNodes = allNodes?.filter(
      i => (i.type === 'mindmap' || i.rootId) && i.id !== currentNode.id && i.width !== undefined && i.height !== undefined
    )
    const midX = currentNode.x + currentNode.width / 2
    const midY = currentNode.y + currentNode.height / 2
    const right = currentNode.x + currentNode.width
    // 思维导图节点应该根据它的子节点扩展高度
    if (nestedNodes?.length) {
      const expanded = produce(nestedNodes, draft => {
        draft.forEach(n => {
          // todo: should get all nested subchildren
          if ((n.type === 'mindmap' && (n.rightChildren?.length || n.leftChildren?.length)) || n.rootId) {
            let rightBox = undefined
            let leftBox = undefined
            if (n.type === 'mindmap') {
              if (n.rightChildren?.length) {
                rightBox = getBoxOfNodes(
                  n.rightChildren
                    .map(i => i.root)
                    .map(id => nodesMap.get(id))
                    .filter(i => i) as IWhiteboardNode[]
                )
              }
              if (n.leftChildren?.length) {
                leftBox = getBoxOfNodes(
                  n.leftChildren
                    .map(i => i.root)
                    .map(id => nodesMap.get(id))
                    .filter(i => i) as IWhiteboardNode[]
                )
              }
            }
            if (n.rootId) {
              try {
                const rootMindmap = instance.getNode?.(n.rootId) as (IWhiteboardNode & { type: 'mindmap' }) | undefined
                if (rootMindmap) {
                  const children = findSubChildren(
                    n.side === 'right' ? rootMindmap.rightChildren || [] : rootMindmap.leftChildren || [],
                    n.id
                  )
                  if (children && children.length) {
                    if (n.side === 'right') {
                      rightBox = getBoxOfNodes(
                        children
                          .map(i => i.root)
                          .map(id => nodesMap.get(id))
                          .filter(i => i) as IWhiteboardNode[]
                      )
                    }
                    if (n.side === 'left') {
                      leftBox = getBoxOfNodes(
                        children
                          .map(i => i.root)
                          .map(id => nodesMap.get(id))
                          .filter(i => i) as IWhiteboardNode[]
                      )
                    }
                  }
                }
              } catch (e) {
                console.error(e)
              }
            }
            if (leftBox || rightBox) {
              const minY = Math.min(leftBox?.top ?? Number.MAX_SAFE_INTEGER, rightBox?.top ?? Number.MAX_SAFE_INTEGER)
              const maxY = Math.max(
                leftBox ? leftBox.top + leftBox.height : Number.MIN_SAFE_INTEGER,
                rightBox ? rightBox.top + rightBox.height : Number.MIN_SAFE_INTEGER
              )
              n.y = minY
              n.height = maxY - minY
            }
          }
        })
      })
      const yAvailableNodes = expanded.filter(i => {
        const top = i.y - middleSpacing
        const bottom = i.y + i.height! + middleSpacing
        if (midY >= top && midY <= bottom) {
          return true
        }
        return false
      })
      // sort by x, from left to right
      yAvailableNodes.sort((b, a) => b.x - a.x)
      // 可用节点的x值
      const xAvailableNodes: {
        node: IWhiteboardNode
        direction: 'left' | 'right'
      }[] = []
      // 这里判断在x上符合的节点，分两种，根节点和子节点，根节点可以有左右，子节点只能在它那个方向创建
      yAvailableNodes.forEach((n, idx, arr) => {
        const nRight = n.width! + n.x
        // 子节点
        if ('side' in n) {
          if (n.side === 'right') {
            // 拖动节点的左边要在本节点的右边的右侧
            if (currentNode.x >= nRight) {
              if (checkX('right', currentNode, n)) {
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
              if (checkX('left', currentNode, n)) {
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
            if (checkX('right', currentNode, n)) {
              xAvailableNodes.push({
                node: n,
                direction: 'right'
              })
            }
          } else {
            if (checkX('left', currentNode, n)) {
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
        const target = xAvailableNodes.find(i => {
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
