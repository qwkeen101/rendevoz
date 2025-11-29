import { XYPosition } from 'rendevoz'
// make edge point at circle and text center
export default (
  position: {
    source: XYPosition
    target: XYPosition
  },
  radius: {
    source: number
    target: number
  }
) => {
  const targetCircleCenter = {
    x: position.target.x + radius.target,
    y: position.target.y + radius.target
  }

  const sourceCircleCenter = {
    x: position.source.x + radius.source,
    y: position.source.y + radius.source
  }

  const finalPosition = {
    sourceX: sourceCircleCenter.x,
    sourceY: sourceCircleCenter.y,
    targetX: targetCircleCenter.x,
    targetY: targetCircleCenter.y
  }
  return {
    finalPosition
  }
}
