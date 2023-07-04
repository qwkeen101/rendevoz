import { Box, Point } from '~/typings'

/** This method returns true if two boxes intersects
 * @param boxA
 * @param boxB
 */
export const boxesIntersect = (boxA: Box, boxB: Box) =>
  boxA.left <= boxB.left + boxB.width &&
  boxA.left + boxA.width >= boxB.left &&
  boxA.top <= boxB.top + boxB.height &&
  boxA.top + boxA.height >= boxB.top

export const calculateSelectionBox = ({ startPoint, endPoint }: { startPoint: Point; endPoint: Point }) => ({
  left: Math.min(startPoint.x, endPoint.x),
  top: Math.min(startPoint.y, endPoint.y),
  width: Math.abs(startPoint.x - endPoint.x),
  height: Math.abs(startPoint.y - endPoint.y)
})

export const calculateBoxArea = (box: Box) => box.width * box.height

export const boxContain = (parentBox: Box, childBox: Box) => {
  if (
    childBox.left >= parentBox.left &&
    childBox.top >= parentBox.top &&
    childBox.left + childBox.width <= parentBox.left + parentBox.width &&
    childBox.top + childBox.height <= parentBox.top + parentBox.height
  ) {
    return true
  }
  return false
}

export const getRelativeBoxSize = (parentBox: Box, childBox: Box) => {
  const relativeX = childBox.left - parentBox.left
  const relativeY = childBox.top - parentBox.top
  const percentageX = relativeX / parentBox.width
  const percentageY = relativeY / parentBox.height
  const percentageWidth = childBox.width / parentBox.width
  const percentageHeight = childBox.height / parentBox.height
  return {
    relativeX,
    relativeY,
    percentageX,
    percentageY,
    percentageWidth,
    percentageHeight
  }
}

export const pointInBox = (point: Point, box: Box) => {
  if (point.x >= box.left && point.y >= box.top && point.x <= box.left + box.width && point.y <= box.top + box.height) {
    return true
  }
  return false
}
