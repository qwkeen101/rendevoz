import { Box, IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { assignProperties, boxContain } from '@/utils'
import { getBoxOfNodes } from '@/core/components/whiteboard/utils'

export const enlargeBox = (currentBox: Box, enlarge: number = 24) => {
  return {
    left: currentBox.left - enlarge,
    top: currentBox.top - enlarge,
    width: currentBox.width + 2 * enlarge,
    height: currentBox.height + 2 * enlarge
  }
}
const near = (a?: number, b?: number) => a !== undefined && b !== undefined && Math.abs(a - b) < 1
const assignGroupOps = (instance: IWhiteboardInstance) => {
  assignProperties(instance, {
    groupOps: {
      renameGroup: groupNodeId => {
        const node = instance.getNode?.(groupNodeId)
        if (!node) throw 'Failed to find node!'
        const headPos = {
          left: node.x,
          top: node.y - 30,
          width: 1,
          height: 20
        }
        instance.containerOps?.fitTo(headPos)
        instance.nodeOps?.getNodeFuncs(groupNodeId)?.setNodeState(s => ({ ...s, isEditingName: true }))
      },
      getParentGroupsOfNode: nodeId => {
        const currentNode = instance.getNode?.(nodeId)
        if (!currentNode) throw 'Failed to find node!'
        const allNodes = instance.getAllNode?.()
        if (!allNodes) throw 'Failed to get all nodes!'
        const currentBox = {
          left: currentNode.x,
          top: currentNode.y,
          width: currentNode.width,
          height: currentNode.height
        }
        return allNodes.filter(
          i => i.type === 'group' && i.id !== nodeId && boxContain({ left: i.x, top: i.y, width: i.width, height: i.height }, currentBox)
        )
      },
      getNodesInGroup: (groupNodeId, includeSelf = false) => {
        const group = instance.getNode?.(groupNodeId)
        if (!group) throw new Error('Can not find node!')
        const allNodes = instance.getAllNode?.()
        if (!allNodes) throw new Error('Can not find node!')
        const gb = {
          left: group.x,
          top: group.y,
          width: group.width,
          height: group.height
        }
        return allNodes.filter(i => {
          if (!includeSelf && i.id === groupNodeId) return false
          const b = {
            left: i.x,
            top: i.y,
            width: i.width,
            height: i.height
          }
          return boxContain(gb, b)
        })
      },
      groupNodes: nodeId => {
        const idArr = Array.isArray(nodeId) ? nodeId : [nodeId]
        const nodes = idArr.map(i => instance.getNode?.(i)).filter(i => i) as IWhiteboardNode[]
        if (nodes.length) {
          const box = getBoxOfNodes(nodes)
          if (box) {
            const enlarged = enlargeBox(box)
            const ifAlreadyHasGroup = instance
              .getAllNode?.()
              .some(
                i =>
                  i.type === 'group' &&
                  near(i.x, enlarged.left) &&
                  near(i.y, enlarged.top) &&
                  near(i.width, enlarged.width) &&
                  near(i.height, enlarged.height)
              )
            if (ifAlreadyHasGroup) return
            instance.insertNode?.({
              type: 'group',
              x: enlarged.left,
              y: enlarged.top,
              width: enlarged.width,
              height: enlarged.height
            })
          }
        }
      }
    }
  })
}

export default assignGroupOps
