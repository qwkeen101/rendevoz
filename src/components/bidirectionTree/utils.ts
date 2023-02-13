import FlowManager from './FlowManager'
import * as d3 from 'd3'
import { MetaLink, MetaObject } from '~/typings/data'
import { globalStore } from '@/stores/stores'
import { metaObjectsAtom, undeletedMetaLinksAtom } from '@/stores/meta.store'
import { ITreeEdge, ITreeNode } from './types'

export const getNodeData = (nodeId: number, flow: FlowManager) => {
  const nodeEle = flow.ID_TO_NODE_ELEMENT_MAP.get(nodeId)?.element
  if (nodeEle) {
    const bound = nodeEle.getBoundingClientRect()
    return {
      bound
    }
  }
}

export const getEdgeData = (sourceNodeId: number, targetNodeId: number, flow: FlowManager) => {
  const sourceNodeData = getNodeData(sourceNodeId, flow)
  const targetNodeData = getNodeData(targetNodeId, flow)
  if (sourceNodeData && targetNodeData) {
    const sourceBound = sourceNodeData.bound
    const targetBound = targetNodeData.bound
    const sourceX = sourceBound.left + sourceBound.width
    const sourceY = sourceBound.top + sourceBound.height / 2
    const targetX = targetBound.left
    const targetY = targetBound.top + targetBound.height / 2
    return {
      sourceX,
      sourceY,
      targetX,
      targetY
    }
  }
}

export const transformXY = (containerRect: DOMRect, posX: number, posY: number, scale: number) => {
  return {
    x: (posX - containerRect.x) / scale,
    y: (posY - containerRect.y) / scale
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
  const leftObjects = targetToSelfLinks.map(i => allMetaObjects.get(i.sourceId)) as MetaObject[]
  const centerObject = allMetaObjects.get(centerNodeId)!
  const rightObjects = selfToTargetLinks.map(i => allMetaObjects.get(i.targetId)) as MetaObject[]
  if (!leftObjects.some(i => i === centerObject)) leftObjects.push(centerObject)
  if (!rightObjects.some(i => i === centerObject)) rightObjects.push(centerObject)
  console.log(leftObjects, rightObjects)
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
    .id(d => String(d.id))
    .parentId(d => (d.id === centerNodeId ? '' : String(centerNodeId)))(leftObjects)
  const right = d3
    .stratify()
    .id(d => String(d.id))
    .parentId(d => (d.id === centerNodeId ? '' : String(centerNodeId)))(rightObjects)
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
    const linkId = stToIdMap.get(`${sourceId}_${targetId}`)
    return {
      id: linkId,
      sourceId,
      targetId
    } as ITreeEdge
  })
  const rightEdges = rightTreeLinks.map(link => {
    const sourceId = Number(link.source.data.data.id)
    const targetId = Number(link.target.data.data.id)
    const linkId = stToIdMap.get(`${sourceId}_${targetId}`)
    return {
      id: linkId,
      sourceId,
      targetId
    } as ITreeEdge
  })
  if (direction === 'left') {
    return {
      nodes: leftTreeNodes.map(node => {
        const { x, y } = node
        const id = Number(node.data.data.id)
        return {
          x: y + 200 + centerNodePos.x,
          y: x + centerNodePos.y,
          id
        } as ITreeNode
      }),
      edges: leftEdges
    }
  }
  if (direction === 'right') {
    return {
      nodes: rightTreeNodes.map(node => {
        const { x, y } = node
        const id = Number(node.data.data.id)
        return {
          x: y + 200 + centerNodePos.x,
          y: x + centerNodePos.y,
          id
        } as ITreeNode
      }),
      edges: rightEdges
    }
  }
  if (direction === 'all') {
    const aggregatedNodes = [...leftTreeNodes, ...rightTreeNodes].map(node => {
      const { x, y } = node
      const id = Number(node.data.data.id)
      return {
        x: y + 200 + centerNodePos.x,
        y: x + centerNodePos.y,
        id
      } as ITreeNode
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
type Position = 'left' | 'right' | 'top' | 'bottom'

export interface GetBezierPathParams {
  sourceX: number
  sourceY: number
  sourcePosition?: Position
  targetX: number
  targetY: number
  targetPosition?: Position
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
  sourcePosition = Position.Bottom,
  targetX,
  targetY,
  targetPosition = Position.Top,
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
