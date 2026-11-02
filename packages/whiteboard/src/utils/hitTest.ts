import { IWhiteboardNode } from '../types/whiteboard'

export const hitTestNode = (point: { x: number; y: number }, nodes: IWhiteboardNode[]) => {
  const hit = nodes.find(n => {
    const w = n.width || 0
    const h = n.height || 0
    return point.x >= n.x && point.x <= n.x + w && point.y >= n.y && point.y <= n.y + h
  })
  return hit
}

export const findNearestNode = (point: { x: number; y: number }, nodes: IWhiteboardNode[], radius: number) => {
  let nearest: IWhiteboardNode | undefined
  let min = radius
  nodes.forEach(node => {
    const cx = node.x + (node.width || 0) / 2
    const cy = node.y + (node.height || 0) / 2
    const d = Math.hypot(point.x - cx, point.y - cy)
    if (d < min) {
      min = d
      nearest = node
    }
  })
  return nearest
}
