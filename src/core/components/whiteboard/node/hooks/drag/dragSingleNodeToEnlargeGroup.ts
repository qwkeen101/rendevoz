import { Box, IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { getBoxOfBoxes } from '@/core/components/whiteboard/utils'

const defaultEnlarge = 24
export default (node: IWhiteboardNode, instance: IWhiteboardInstance, availableGroups: (IWhiteboardNode & { type: 'group' })[]) => {
  let nodeBox: Box | undefined = undefined
  if (node.type === 'mindmap') {
    const allNodes = [node, ...(instance.mindmapOps?.expandMindmap(node) || [])]
    const allBoxes = allNodes.map(i => instance.nodeOps?.getNodeFuncs(i.id)?.getRealtimeBox()).filter(i => i) as Box[]
    nodeBox = getBoxOfBoxes(allBoxes)
  } else {
    nodeBox = instance.nodeOps?.getNodeFuncs(node.id)?.getRealtimeBox()
  }
  if (!nodeBox) return
  const newGroups = availableGroups
    .map(g => {
      const inGroupNodes = instance.groupOps?.getNodesInGroup(g.id, true) || []
      const allInGroupNodesBox = inGroupNodes.map(n => instance.nodeOps?.getNodeFuncs(n.id)?.getRealtimeBox()).filter(i => i) as Box[]
      const newGroupBox = getBoxOfBoxes([...allInGroupNodesBox, nodeBox!])
      if (newGroupBox) {
        if (newGroupBox.left + newGroupBox.width > g.x + g.width) {
          newGroupBox.width += defaultEnlarge
        }
        if (newGroupBox.top + newGroupBox.height > g.y + g.height) {
          newGroupBox.height += defaultEnlarge
        }
        if (newGroupBox.left < g.x) {
          newGroupBox.left -= defaultEnlarge
          newGroupBox.width += 2 * defaultEnlarge
        }
        if (newGroupBox.top < g.y) {
          newGroupBox.top -= defaultEnlarge
          newGroupBox.height += 2 * defaultEnlarge
        }
        return {
          enlarged: newGroupBox,
          id: g.id
        }
      }
    })
    .filter(i => i)
  if (newGroups.length) {
    instance.updateWhiteboard?.(w => {
      const groupSizes: IWhiteboardNode[] = []
      newGroups.forEach(g => {
        const origin = w.nodes?.get(g.id)
        if (origin) {
          const newOrigin = {
            ...origin,
            x: g.enlarged.left,
            y: g.enlarged.top,
            width: g.enlarged.width,
            height: g.enlarged.height
          }
          w.nodes?.set(g.id, newOrigin)
          groupSizes.push(newOrigin)
        }
      })
      instance.emit?.({
        type: 'nodeResized',
        resized: groupSizes
      })
    }, true)
  }
}
