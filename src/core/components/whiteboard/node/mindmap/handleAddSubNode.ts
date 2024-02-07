import { IWhiteboardNode } from '~/typings'
import { addToTree } from '@/core/components/whiteboard/node/mindmap/handleNodeDragEnd'
import produce from 'immer'

export default (result: {
  rightIds: Set<number>
  leftIds: Set<number>
  direction: 'right' | 'left'
  newNode: IWhiteboardNode
  idx: number
  targetId: number
  currNode: IWhiteboardNode & { type: 'mindmap' }
}) => {
  const { rightIds, leftIds, newNode, idx, targetId, direction, currNode } = result
  if (rightIds.has(targetId) || (targetId === currNode.id && direction === 'right')) {
    const newRightChildren = produce(currNode.rightChildren || [], draft => {
      addToTree({ root: currNode.id, children: draft }, targetId, idx, {
        root: newNode.id,
        children: []
      })
    })
    return {
      ...currNode,
      rightChildren: newRightChildren
    }
  }
  if (leftIds.has(targetId)) {
  }
}
