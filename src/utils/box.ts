import { Box, Point, XYPosition } from '~/typings'

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

export const pointInBox = (point: Point, box: Box, tolerance = 0) => {
  if (
    point.x >= box.left - tolerance &&
    point.y >= box.top - tolerance &&
    point.x <= box.left + box.width + tolerance &&
    point.y <= box.top + box.height + tolerance
  ) {
    return true
  }
  return false
}

export const getBoundsOfPoints = (points: XYPosition[]) => {
  let minX = Number.MAX_SAFE_INTEGER,
    minY = Number.MAX_SAFE_INTEGER,
    maxX = Number.MIN_SAFE_INTEGER,
    maxY = Number.MIN_SAFE_INTEGER
  points.forEach(i => {
    minX = Math.min(i.x, minX)
    maxX = Math.max(i.x, maxX)
    minY = Math.min(i.y, minY)
    maxY = Math.max(i.y, maxY)
  })
  return {
    minX,
    minY,
    maxX,
    maxY
  }
}
