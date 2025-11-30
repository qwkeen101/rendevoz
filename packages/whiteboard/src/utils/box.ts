import { Box } from '../types/geometry'
import { IWhiteboardNode } from '../types/whiteboard'

export const getBoxOfBoxes = (boxes: Box[]): Box | undefined => {
  let minX = Number.MAX_VALUE
  let minY = Number.MAX_VALUE
  let maxX = -Number.MAX_VALUE
  let maxY = -Number.MAX_VALUE

  for (const box of boxes) {
    if (box.width === undefined || box.height === undefined) return
    const left = box.left ?? box.x
    const top = box.top ?? box.y
    minX = Math.min(minX, left)
    minY = Math.min(minY, top)
    maxX = Math.max(maxX, left + box.width)
    maxY = Math.max(maxY, top + box.height)
  }
  return {
    x: minX,
    y: minY,
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

export const getBoxOfPoints = (points: [number, number][]) => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  points.forEach(p => {
    minX = Math.min(minX, p[0])
    minY = Math.min(minY, p[1])
    maxX = Math.max(maxX, p[0])
    maxY = Math.max(maxY, p[1])
  })
  return {
    x: minX,
    y: minY,
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

export const getBoxOfNodes = (nodes: IWhiteboardNode[]): Box | undefined => {
  if (nodes.length === 0) {
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 0,
      height: 0
    }
  }
  const boxes = nodes.map(i => ({
    x: i.x,
    y: i.y,
    left: i.x,
    top: i.y,
    width: i.width || 0,
    height: i.height || 0
  })) as Box[]
  return getBoxOfBoxes(boxes)
}
