import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import produce from 'immer'
import { getBoxOfNodes } from '@/core/components/whiteboard/utils'

const middleSpacing = 100
const xSpacing = 200
const columnSpacing = 10
export default (currentNode: IWhiteboardNode, instance: IWhiteboardInstance, e: PointerEvent) => {
  const transformed = instance.coordOps?.transformWindowPositionToPosition({ x: e.clientX, y: e.clientY })
  if (currentNode.width === undefined || currentNode.height === undefined) return
  if (transformed) {
    const allNodes = instance.getAllNode?.()
    const nodesMap = new Map(allNodes?.map(i => [i.id, i]))
    const nestedNodes = allNodes?.filter(
      i => (i.type === 'mindmap' || i.nested) && i.id !== currentNode.id && i.width !== undefined && i.height !== undefined
    )
    const midX = currentNode.x + currentNode.width / 2
    const midY = currentNode.y + currentNode.height / 2
    const right = currentNode.x + currentNode.width
    // 思维导图节点应该根据它的子节点扩展高度
    if (nestedNodes?.length) {
      const expanded = produce(nestedNodes, draft => {
        draft.forEach(n => {
          // todo: should get all nested subchildren
          if (n.type === 'mindmap' && (n.rightChildren?.length || n.leftChildren?.length)) {
            let rightBox = undefined
            let leftBox = undefined
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
      let availableNode:
        | {
            node: IWhiteboardNode
            direction: 'left' | 'right'
          }
        | undefined = undefined
      // 这是判断右树，判断左树应该还有一套
      yAvailableNodes.find((n, idx, arr) => {
        const prev = arr[idx - 1]
        const next = arr[idx + 1]
        const nRight = n.x + n.width!
        // 如果有前一个节点，就只能添加到右边
        if (prev) {
          if (Math.abs(n.x - right) > xSpacing) {
            return false
          }
          availableNode = {
            node: n,
            direction: n.side || 'right'
          }
          return true
        } else {
          // first, check if left
          if (midX < n.x + n.width! / 2) {
            if (right < n.x) {
              // x超出范围
              if (Math.abs(n.x - right) > xSpacing) {
                return false
              }
            }
            // is left
            availableNode = {
              node: n,
              direction: 'left'
            }
            return true
          }

          // 如果有后一个节点，判定是否拖动的节点的left在后一个节点midx以前
          if (next) {
            if (currentNode.x <= next.x + next.width! / 2) {
              // 就算有后一个节点，也不能超出范围
              if (currentNode.x > nRight) {
                if (Math.abs(currentNode.x - nRight) > xSpacing) {
                  return false
                }
              }
              availableNode = {
                node: n,
                direction: 'right'
              }
              return true
            }
            // 向后一个节点判定
            return false
          } else {
            if (currentNode.x > nRight) {
              if (Math.abs(currentNode.x - nRight) > xSpacing) {
                return false
              }
            }
            availableNode = {
              node: n,
              direction: 'right'
            }
            return true
            // 没有后一个节点，判定是否在x的范围内
          }
        }
      })
      if (availableNode !== undefined) {
        const availableX = availableNode.node.x as number
        // 一列节点中寻找
        const columnNodes = yAvailableNodes.filter(i => i.x === availableX)
        if (columnNodes.length === 1) {
          return columnNodes[0]
        }
        // 按照从上到下排列
        columnNodes.sort((b, a) => b.y - a.y)
        const finalNode = columnNodes.find(i => {
          if (midY >= i.y - columnSpacing && midY <= i.y + i.height + columnSpacing) {
            return true
          }
          return false
        })
        return finalNode
      }
    }
  }
}
