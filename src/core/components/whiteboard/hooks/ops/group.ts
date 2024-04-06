import { Box, IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { assignProperties, boxContain, calculateImageAspectRatio, downloadImg } from '@/utils'
import { getBoxOfBoxes, getBoxOfNodes } from '@/core/components/whiteboard/utils'
import { exportWhiteboardAsImage } from '@/core/components/whiteboard/utils/exportAsImage'
import groupStore from '@/api/stores/group.store'

export const enlargeBox = (currentBox: Box, enlarge: number = 30) => {
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
      exportGroupImage: groupId => {
        const boxes = instance.nodeOps?.getDOMBoxOfNodes(groupId)
        const groupBox = boxes?.[groupId]
        const group = instance.getNode?.(groupId)
        if (groupBox && group) {
          const allNodes = instance.getAllNode?.()
          const container = instance.getContainerNode?.()
          if (allNodes && container) {
            const { width, height } = calculateImageAspectRatio(groupBox.width, groupBox.height, 8000, 8000)
            exportWhiteboardAsImage(allNodes, container, instance, {
              as: 'png',
              area: 'visible',
              box: groupBox,
              width: width,
              height: height,
              padding: 0
            }).then(i => {
              downloadImg(i, `${group.name || 'group'}.png`)
            })
          }
        }
      },
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
      getParentGroupsOfNode: (nodeId, mindmapChildUseRoot) => {
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
        const rootBox = mindmapChildUseRoot && currentNode.rootId && instance.nodeOps?.getNodeFuncs(currentNode.rootId)?.getRealtimeBox()
        return allNodes.filter(i => {
          if (i.type === 'group' && i.id !== nodeId) {
            const groupBox = instance.nodeOps?.getNodeFuncs(i.id)?.getRealtimeBox()
            if (!groupBox) return false
            return boxContain(groupBox, currentBox) || (mindmapChildUseRoot && rootBox && boxContain(groupBox, rootBox))
          }
          return false
        })
      },
      getNodesInGroup: (groupNodeId, includeSelf = false, mindmapChildUseRoot = false) => {
        const group = instance.getNode?.(groupNodeId)
        if (!group) throw new Error('Can not find node!')
        const allNodes = instance.getAllNode?.()
        if (!allNodes) throw new Error('Can not find node!')
        const gb = instance.nodeOps?.getNodeFuncs(group.id)?.getRealtimeBox()
        if (!gb) throw new Error('Can not get group box!')
        return allNodes.filter(i => {
          if (!includeSelf && i.id === groupNodeId) return false
          const b = {
            left: i.x,
            top: i.y,
            width: i.width,
            height: i.height
          }
          if (i.rootId && mindmapChildUseRoot) {
            // contains self
            if (boxContain(gb, b)) return true
            const root = instance.nodeOps?.getDOMBoxOfNodes(i.rootId)
            if (root) {
              const rootBox = root[i.rootId]
              // contains root
              return boxContain(gb, rootBox)
            }
            return false
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
