import FlowManager from './FlowManager'
import * as d3 from 'd3'
import { IWhiteboardInstance, MetaLink } from '~/typings/data'
import { globalStore } from '@/api/stores'
import { metaObjectsAtom, undeletedMetaLinksAtom } from '@/api/stores/meta/meta.store'
import { EdgePosition, IWhiteboardEdge, IWhiteboardNode, Box } from '~/typings'
import Id from '@/utils/id'
import { Position } from '@/types'
import { trimNumber } from '@/utils'

export const getNodeData = (nodeId: number, instance: IWhiteboardInstance) => {
  const nodeEle = flow.ID_TO_NODE_ELEMENT_MAP.get(nodeId)?.element
  if (nodeEle) {
    const bound = nodeEle.getBoundingClientRect()
    const transformedXY = transformXY(flow.containerEle?.getBoundingClientRect(), bound.x, bound.y, flow.containerTransformScale)
    return {
      bound,
      transformedXY
    }
  }
}

export const getEdgeData = (
  sourceNodeId: number,
  targetNodeId: number,
  sourcePosition: EdgePosition,
  targetPosition: EdgePosition,
  instance: IWhiteboardInstance
) => {
  const sourceXY = getHandlePosition(sourceNodeId, sourcePosition, instance)
  const targetXY = getHandlePosition(targetNodeId, targetPosition, instance)
  if (!sourceXY || !targetXY) {
    throw new Error('Can not get edge data!')
  }
  return {
    sourceXY,
    targetXY
  }
}
export const isPointerOnContainer = (e: PointerEvent | MouseEvent, instance: IWhiteboardInstance) => {
  const parentContainer = instance.getOutestContainerNode?.()
  if (!parentContainer) return false
  if (!parentContainer.contains(e.target)) return false
  const target = e.target as HTMLElement
  const targetNodeId = target.getAttribute('data-node-id')
  if (targetNodeId) {
    const targetNode = instance.getNode?.(Number(targetNodeId))
    if (targetNode) {
      if (targetNode.type === 'group') {
        const nodeState = instance.nodeOps?.getNodeFuncs(targetNode.id)?.getNodeState()
        if (nodeState?.focused || nodeState?.selected) return false
        return true
      }
    }
  }
  if (!target.hasAttribute('role')) return false

  const role = (e.target as HTMLElement).getAttribute('role')
  if (role === 'modal' || role === 'data-container') return true
  return false
}
const handleOffset = 4
export const getHandlePosition = (nodeId: number, handlePosition: EdgePosition, instance: IWhiteboardInstance) => {
  const realtimeNodeBox = instance.values.ID_TO_NODE_MAP.get(nodeId)?.getRealtimeBox()
  if (!realtimeNodeBox) {
    throw new Error('Can not find node: ' + nodeId)
  }
  const transform = instance.getTransform?.()
  if (!transform) {
    throw new Error('Can not get container transform!')
  }
  const { left, top, width, height } = realtimeNodeBox
  switch (handlePosition) {
    case 'top':
      return {
        x: left + width / 2,
        y: top - handleOffset
      }
    case 'left':
      return {
        x: left - handleOffset,
        y: top + height / 2
      }
    case 'right':
      return {
        x: left + width + handleOffset,
        y: top + height / 2
      }
    case 'bottom':
      return {
        x: left + width / 2,
        y: top + height + handleOffset
      }
  }
}
const toleranceRate = 0.2
export const getRelativeHandlePosition = (
  containerSize: { width: number; height: number },
  relativePosition: { x: number; y: number }
): EdgePosition => {
  const { width, height } = containerSize
  const tolaranceWidth = toleranceRate * width
  const halfHeight = height / 2
  const { x, y } = relativePosition
  if (x < tolaranceWidth) {
    return 'left'
  }
  if (width - x < tolaranceWidth) {
    return 'right'
  }
  if (y > halfHeight) {
    return 'bottom'
  }
  return 'top'
}

export const transformXY = (containerRect: DOMRect, posX: number, posY: number, scale: number) => {
  if (!containerRect) throw new Error('No whiteboard container bounding!')
  return {
    x: trimNumber((posX - containerRect.x) / scale, 2),
    y: trimNumber((posY - containerRect.y) / scale, 2)
  }
}

export const expandNode = (centerNodeId: number, centerNodePos: { x: number; y: number }, direction: 'left' | 'right' | 'all') => {
  const targetToSelfLinks: MetaLink[] = []
  const selfToTargetLinks: MetaLink[] = []
  const stToIdMap = new Map<string, number>()
  const undeletedLinks = globalStore.get(undeletedMetaLinksAtom)
  const allMetaObjects = globalStore.get(metaObjectsAtom)
  undeletedLinks.forEach(link => {
    stToIdMap.set(`${link.sourceId}_${link.targetId}`, link.id)
    if (link.targetId === centerNodeId) {
      allMetaObjects.has(link.sourceId) && targetToSelfLinks.push(link)
    }
    if (link.sourceId === centerNodeId) {
      allMetaObjects.has(link.targetId) && selfToTargetLinks.push(link)
    }
  })
  const leftObjects = targetToSelfLinks.map(i => {
    const obj = allMetaObjects.get(i.sourceId)
    return {
      id: Id.getId(),
      metaObjectId: obj?.id
    }
  })
  const centerObject = {
    id: Id.getId(),
    metaObjectId: centerNodeId
  }
  const rightObjects = selfToTargetLinks.map(i => {
    const obj = allMetaObjects.get(i.targetId)
    return {
      id: Id.getId(),
      metaObjectId: obj?.id
    }
  })
  if (!leftObjects.some(i => i.metaObjectId === centerObject.metaObjectId)) leftObjects.push(centerObject)
  if (!rightObjects.some(i => i.metaObjectId === centerObject.metaObjectId)) rightObjects.push(centerObject)

  undeletedLinks.forEach(link => {
    stToIdMap.set(`${link.sourceId}_${link.targetId}`, link.id)
    if (link.targetId === centerNodeId) {
      allMetaObjects.has(link.sourceId) && targetToSelfLinks.push(link)
    }
    if (link.sourceId === centerNodeId) {
      allMetaObjects.has(link.targetId) && selfToTargetLinks.push(link)
    }
  })

  const left = d3
    .stratify()
    .id(d => String(d.metaObjectId))
    .parentId(d => (Number(d.metaObjectId) === centerNodeId ? '' : String(centerNodeId)))(leftObjects)

  const right = d3
    .stratify()
    .id(d => String(d.metaObjectId))
    .parentId(d => (Number(d.metaObjectId === centerNodeId) ? '' : String(centerNodeId)))(rightObjects)

  const leftTreeData = d3.hierarchy(left)
  const rightTreeData = d3.hierarchy(right)
  const leftTree = d3.tree().nodeSize([100, -600])
  const rightTree = d3.tree().nodeSize([100, 600])
  leftTree(leftTreeData)
  rightTree(rightTreeData)

  const leftTreeLinks = leftTreeData.links()
  const rightTreeLinks = rightTreeData.links()
  const leftTreeNodes = leftTreeData.descendants()
  const rightTreeNodes = rightTreeData.descendants()
  const leftEdges = leftTreeLinks.map(link => {
    const sourceId = Number(link.target.data.data.id)
    const targetId = Number(link.source.data.data.id)
    const sourceObjectId = Number(link.target.data.data.metaObjectId)
    const targetObjectId = Number(link.source.data.data.metaObjectId)
    const linkId = stToIdMap.get(`${sourceObjectId}_${targetObjectId}`)
    return {
      id: Id.getId(),
      metaLinkId: linkId,
      sourceId,
      targetId
    } as IWhiteboardEdge
  })
  const rightEdges = rightTreeLinks.map(link => {
    const sourceId = Number(link.source.data.data.id)
    const targetId = Number(link.target.data.data.id)
    const sourceObjectId = Number(link.source.data.data.metaObjectId)
    const targetObjectId = Number(link.target.data.data.metaObjectId)
    const linkId = stToIdMap.get(`${sourceObjectId}_${targetObjectId}`)
    return {
      id: Id.getId(),
      metaLinkId: linkId,
      sourceId,
      targetId
    } as IWhiteboardEdge
  })
  if (direction === 'left') {
    return {
      nodes: leftTreeNodes.map(node => {
        const { x, y } = node
        const id = Number(node.data.data.id)
        const metaObjectId = Number(node.data.data.metaObjectId)
        return {
          x: y + 200 + centerNodePos.x,
          y: x + centerNodePos.y,
          id,
          metaObjectId,
          type: 'metaObject'
        } as IWhiteboardNode
      }),
      edges: leftEdges
    }
  }
  if (direction === 'right') {
    return {
      nodes: rightTreeNodes.map(node => {
        const { x, y } = node
        const id = Number(node.data.data.id)
        const metaObjectId = Number(node.data.data.metaObjectId)
        return {
          x: y + 200 + centerNodePos.x,
          y: x + centerNodePos.y,
          id,
          metaObjectId,
          type: 'metaObject'
        } as IWhiteboardNode
      }),
      edges: rightEdges
    }
  }
  if (direction === 'all') {
    const aggregatedNodes = [...leftTreeNodes, ...rightTreeNodes].map(node => {
      const { x, y } = node
      const id = Number(node.data.data.id)
      const metaObjectId = Number(node.data.data.metaObjectId)
      return {
        x: y + 200 + centerNodePos.x,
        y: x + centerNodePos.y,
        id,
        metaObjectId,
        type: 'metaObject'
      } as IWhiteboardNode
    })
    return {
      nodes: aggregatedNodes,
      edges: [...leftEdges, ...rightEdges]
    }
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
  // cubic bezier t=0.5 mid point, not the actual mid point, but easy to calculate
  // https://stackoverflow.com/questions/67516101/how-to-find-distance-mid-point-of-bezier-curve
  const centerX = sourceX * 0.125 + sourceControlX * 0.375 + targetControlX * 0.375 + targetX * 0.125
  const centerY = sourceY * 0.125 + sourceControlY * 0.375 + targetControlY * 0.375 + targetY * 0.125
  const offsetX = Math.abs(centerX - sourceX)
  const offsetY = Math.abs(centerY - sourceY)

  return [centerX, centerY, offsetX, offsetY]
}

export interface GetBezierPathParams {
  sourceX: number
  sourceY: number
  sourcePosition?: EdgePosition
  targetX: number
  targetY: number
  targetPosition?: EdgePosition
  curvature?: number
}

interface GetControlWithCurvatureParams {
  pos: Position
  x1: number
  y1: number
  x2: number
  y2: number
  c: number
}

function calculateControlOffset(distance: number, curvature: number): number {
  if (distance >= 0) {
    return 0.5 * distance
  }

  return curvature * 25 * Math.sqrt(-distance)
}
const Position = {
  Left: 'left',
  Right: 'right',
  Top: 'top',
  Bottom: 'bottom'
}
function getControlWithCurvature({ pos, x1, y1, x2, y2, c }: GetControlWithCurvatureParams): [number, number] {
  switch (pos) {
    case Position.Left:
      return [x1 - calculateControlOffset(x1 - x2, c), y1]
    case Position.Right:
      return [x1 + calculateControlOffset(x2 - x1, c), y1]
    case Position.Top:
      return [x1, y1 - calculateControlOffset(y1 - y2, c)]
    case Position.Bottom:
      return [x1, y1 + calculateControlOffset(y2 - y1, c)]
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
}: GetBezierPathParams): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number] {
  const [sourceControlX, sourceControlY] = getControlWithCurvature({
    pos: sourcePosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY,
    c: curvature
  })
  const [targetControlX, targetControlY] = getControlWithCurvature({
    pos: targetPosition,
    x1: targetX,
    y1: targetY,
    x2: sourceX,
    y2: sourceY,
    c: curvature
  })
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

export const getBoxOfBoxes = (boxes: Box[]): Box | undefined => {
  let minX = Number.MAX_VALUE,
    minY = Number.MAX_VALUE,
    maxX = -Number.MAX_VALUE,
    maxY = -Number.MAX_VALUE
  for (const box of boxes) {
    if (box.width === undefined || box.height === undefined) return
    minX = Math.min(minX, box.left)
    minY = Math.min(minY, box.top)
    maxX = Math.max(maxX, box.left + box.width)
    maxY = Math.max(maxY, box.top + box.height)
  }
  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}
export const getBoxOfPoints = (points: [number, number][]) => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  points.forEach(p => {
    minX = Math.min(minX, p[0])
    minY = Math.min(minY, p[1])
    maxX = Math.max(maxX, p[0])
    maxY = Math.max(maxY, p[1])
  })
  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}
export const getBoxOfNodes = (nodes: IWhiteboardNode[]): Box | undefined => {
  if (nodes.length === 0) {
    return {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    }
  }
  const boxes = nodes.map(i => ({
    left: i.x,
    top: i.y,
    width: i.width || 0,
    height: i.height || 0
  })) as Box[]
  return getBoxOfBoxes(boxes)
}
