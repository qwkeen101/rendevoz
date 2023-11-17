import { XYPosition } from 'rendevoz'
import { line } from 'd3-shape'
// make edge point at circle and text center
const DEFAULT_Y_OFFSET = 0
const DEFAULT_CIRCLE_OFFSET = 40
const lineFunc = line()
export default (
  position: {
    source: XYPosition
    target: XYPosition
  },
  radius: {
    source: number
    target: number
  },
  hasOpposite: boolean,
  needOffset?: boolean,
  needPathString?: boolean
) => {
  const targetCircleCenter = {
    x: position.target.x + radius.target,
    y: position.target.y + radius.target + DEFAULT_Y_OFFSET
  }

  const sourceCircleCenter = {
    x: position.source.x + radius.source,
    y: position.source.y + radius.source + DEFAULT_Y_OFFSET
  }

  // const distance = Math.sqrt(
  //   Math.pow(targetCircleCenter.x - sourceCircleCenter.x, 2) + Math.pow(targetCircleCenter.y - sourceCircleCenter.y, 2)
  // )
  // const sourceRatio = (radius.source + DEFAULT_CIRCLE_OFFSET) / distance
  // const targetRatio = (radius.target + DEFAULT_CIRCLE_OFFSET) / distance

  // const delta = {
  //   sourceDx: horizontalDistance * sourceRatio,
  //   sourceDy: verticalDistance * sourceRatio,
  //   targetDx: horizontalDistance * targetRatio,
  //   targetDy: verticalDistance * targetRatio
  // }
  // let offsetX = 0,
  //   offsetY = 0
  // if (hasOpposite) {
  //   const horizontalDistance = targetCircleCenter.x - sourceCircleCenter.x
  //   const verticalDistance = targetCircleCenter.y - sourceCircleCenter.y
  //   const alphaAngle = Math.atan2(verticalDistance, horizontalDistance)
  //   offsetX = 8 * Math.sin(alphaAngle)
  //   offsetY = 16 * Math.cos(alphaAngle)
  // }
  const finalPosition = {
    sourceX: sourceCircleCenter.x,
    sourceY: sourceCircleCenter.y,
    targetX: targetCircleCenter.x,
    targetY: targetCircleCenter.y
  }
  // const points = [
  //   [~~(finalPosition.sourceX + offsetX), ~~(finalPosition.sourceY - offsetY)],
  //   [~~(finalPosition.targetX + offsetX), ~~(finalPosition.targetY - offsetY)]
  // ]
  // const points = [
  //   [~~finalPosition.sourceX, ~~finalPosition.sourceY],
  //   [~~finalPosition.targetX, ~~finalPosition.targetY]
  // ]
  // const pathString = needPathString ? lineFunc(points) : undefined
  return {
    finalPosition
    // pathString
  }
}
