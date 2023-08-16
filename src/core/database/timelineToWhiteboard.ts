import { Box, IWhiteboardEdge } from '~/typings'
import { boxesIntersect } from '@/utils'

export const getEdgePosition = (sourceBox: Box, targetBox: Box) => {
  let sourcePos, targetPos
  // vertically intersected, edge pos => top & bottom
  if (sourceBox.left + sourceBox.width >= targetBox.left && sourceBox.left <= targetBox.left + targetBox.width) {
    if (sourceBox.top < targetBox.top) {
      sourcePos = 'bottom'
      targetPos = 'top'
    } else {
      sourcePos = 'top'
      targetPos = 'bottom'
    }
    return {
      sourcePos,
      targetPos
    }
  }
  // horizontally intersected

  if (sourceBox.left < targetBox.left) {
    sourcePos = 'right'
    targetPos = 'left'
  } else {
    sourcePos = 'left'
    targetPos = 'right'
  }
  return {
    targetPos,
    sourcePos
  }
}

boxesIntersect
