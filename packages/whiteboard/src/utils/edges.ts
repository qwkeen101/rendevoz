import { EdgePosition, IWhiteboardNode } from '../types/whiteboard'
import { Box, XYPosition } from '../types/geometry'
import { trimNumber } from './number'

export const getRelativeHandlePosition = (
  containerSize: { width: number; height: number },
  relativePosition: { x: number; y: number }
): EdgePosition => {
  const { width, height } = containerSize
  const toleranceWidth = 0.2 * width
  const halfHeight = height / 2
  const { x, y } = relativePosition
  if (x < toleranceWidth) return 'left'
  if (width - x < toleranceWidth) return 'right'
  if (y > halfHeight) return 'bottom'
  return 'top'
}

export const transformXY = (containerRect: DOMRect, posX: number, posY: number, scale: number) => {
  if (!containerRect) throw new Error('No whiteboard container bounding!')
  return {
    x: trimNumber((posX - containerRect.x) / scale, 2),
    y: trimNumber((posY - containerRect.y) / scale, 2)
  }
}

export const getHandlePosition = ({
  node,
  handle,
  realtimeBox,
  isMindmap,
  handleOffset
}: {
  node: IWhiteboardNode
  handle: EdgePosition
  realtimeBox: { left: number; top: number; width: number; height: number }
  isMindmap?: boolean
  handleOffset?: number
}): XYPosition | undefined => {
  const offset = isMindmap ? 0 : handleOffset ?? 4
  const { left, top, width, height } = realtimeBox
  if (width === 0 || height === 0) return
  if (node.borderType === 'underline' && isMindmap) {
    if (handle === 'left') return { x: left, y: top + height }
    if (handle === 'right') return { x: left + width, y: top + height }
  }
  switch (handle) {
    case 'top':
      return { x: left + width / 2, y: top - offset }
    case 'left':
      return { x: left - offset, y: top + height / 2 }
    case 'right':
      return { x: left + width + offset, y: top + height / 2 }
    case 'bottom':
      return { x: left + width / 2, y: top + height + offset }
    case 'top-left':
      return { x: left, y: top }
    case 'top-right':
      return { x: left + width, y: top }
    case 'bottom-left':
      return { x: left, y: top + height }
    case 'bottom-right':
      return { x: left + width, y: top + height }
  }
}

export function getBezierEdgeCenter({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourceControlX,
  sourceControlY,
  targetControlX,
  targetControlY
}: {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourceControlX: number
  sourceControlY: number
  targetControlX: number
  targetControlY: number
}): [number, number, number, number] {
  const centerX = sourceX * 0.125 + sourceControlX * 0.375 + targetControlX * 0.375 + targetX * 0.125
  const centerY = sourceY * 0.125 + sourceControlY * 0.375 + targetControlY * 0.375 + targetY * 0.125
  const offsetX = Math.abs(centerX - sourceX)
  const offsetY = Math.abs(centerY - sourceY)
  return [centerX, centerY, offsetX, offsetY]
}

type Position = EdgePosition

function calculateControlOffset(distance: number, curvature: number): number {
  if (distance >= 0) {
    return 0.5 * distance
  }
  return curvature * 25 * Math.sqrt(-distance)
}

function getControlWithCurvature({ pos, x1, y1, x2, y2, c }: { pos: Position; x1: number; y1: number; x2: number; y2: number; c: number }) {
  switch (pos) {
    case 'left':
      return [x1 - calculateControlOffset(x1 - x2, c), y1]
    case 'right':
      return [x1 + calculateControlOffset(x2 - x1, c), y1]
    case 'top':
      return [x1, y1 - calculateControlOffset(y1 - y2, c)]
    case 'bottom':
      return [x1, y1 + calculateControlOffset(y2 - y1, c)]
    // 角点处理：向外延伸对角线方向，或者简化为垂直/水平
    // 这里采用简化策略：根据对方位置决定主要方向，或者默认45度
    case 'top-left':
      return [x1 - calculateControlOffset(x1 - x2, c), y1 - calculateControlOffset(y1 - y2, c)]
    case 'top-right':
      return [x1 + calculateControlOffset(x2 - x1, c), y1 - calculateControlOffset(y1 - y2, c)]
    case 'bottom-left':
      return [x1 - calculateControlOffset(x1 - x2, c), y1 + calculateControlOffset(y2 - y1, c)]
    case 'bottom-right':
      return [x1 + calculateControlOffset(x2 - x1, c), y1 + calculateControlOffset(y2 - y1, c)]
    default:
      return [x1, y1]
  }
}

export function getBezierPath({
  sourceX,
  sourceY,
  sourcePosition = 'bottom',
  targetX,
  targetY,
  targetPosition = 'top',
  curvature = 0.25
}: {
  sourceX: number
  sourceY: number
  sourcePosition?: EdgePosition
  targetX: number
  targetY: number
  targetPosition?: EdgePosition
  curvature?: number
}): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number] {
  const [sourceControlX, sourceControlY] = getControlWithCurvature({
    pos: sourcePosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY,
    c: curvature
  })!
  const [targetControlX, targetControlY] = getControlWithCurvature({
    pos: targetPosition,
    x1: targetX,
    y1: targetY,
    x2: sourceX,
    y2: sourceY,
    c: curvature
  })!
  const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY
  })
  return [
    `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
    labelX,
    labelY,
    offsetX,
    offsetY
  ]
}

export const getEdgeData = (
  sourceNodeId: number,
  targetNodeId: number,
  sourcePosition: EdgePosition,
  targetPosition: EdgePosition,
  instance: {
    getNode?: (id: number) => IWhiteboardNode | undefined
    getHandleBox?: (id: number) => Box | undefined
  },
  isMindmap = false
) => {
  const sourceNode = instance.getNode?.(sourceNodeId)
  const targetNode = instance.getNode?.(targetNodeId)
  const sourceBox = instance.getHandleBox?.(sourceNodeId)
  const targetBox = instance.getHandleBox?.(targetNodeId)
  if (!sourceNode || !targetNode || !sourceBox || !targetBox) return

  const sourceXY = getHandlePosition({
    node: sourceNode,
    handle: sourcePosition,
    realtimeBox: {
      left: sourceBox.left ?? sourceBox.x,
      top: sourceBox.top ?? sourceBox.y,
      width: sourceBox.width,
      height: sourceBox.height
    },
    isMindmap
  })
  const targetXY = getHandlePosition({
    node: targetNode,
    handle: targetPosition,
    realtimeBox: {
      left: targetBox.left ?? targetBox.x,
      top: targetBox.top ?? targetBox.y,
      width: targetBox.width,
      height: targetBox.height
    },
    isMindmap
  })
  if (!sourceXY || !targetXY) return
  return { sourceXY, targetXY }
}
