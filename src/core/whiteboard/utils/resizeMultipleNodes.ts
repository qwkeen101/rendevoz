import { IWhiteboardNode, Size, XYPosition } from '~/typings'
import { getBoxOfNodes } from '@/core/whiteboard/utils'
import FlowManager from '@/core/whiteboard/FlowManager'

const resizeMultipleNodes = (
  flow: FlowManager,
  // original nodes when resize begin, we don't update their states when resizing, only update when resize ends
  // mutate its size by using ref
  selectedNodes: IWhiteboardNode[],
  handleType: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight',
  shouldResizeFromCenter: boolean,
  pointerPos: {
    x: number
    y: number
  }
) => {
  const commonBounding = getBoxOfNodes(selectedNodes)
  if (commonBounding) {
    const { x: pointerX, y: pointerY } = pointerPos
    const { midX, minY, maxX, maxY, midY, minX } = {
      minX: commonBounding.left,
      minY: commonBounding.top,
      maxX: commonBounding.left + commonBounding.width,
      maxY: commonBounding.top + commonBounding.height,
      midX: commonBounding.left + commonBounding.width / 2,
      midY: commonBounding.top + commonBounding.height / 2
    }
    const mapDirectionsToAnchors = {
      topLeft: [maxX, maxY],
      topRight: [minX, maxY],
      bottomLeft: [maxX, minY],
      bottomRight: [minX, minY]
    }

    const currentNodes = selectedNodes.map(n => {
      const latest = {
        ...n,
        ...flow.getLatestNodeSize(n.id)
      }
      return {
        origin: n,
        latest
      }
    })
    const newNodesToUpdate: ({ id: number } & Size & XYPosition)[] = []
    const [anchorX, anchorY] = shouldResizeFromCenter ? [midX, midY] : mapDirectionsToAnchors[handleType]
    const scale =
      Math.max(Math.abs(pointerX - anchorX) / (maxX - minX) || 0, Math.abs(pointerY - anchorY) / (maxY - minY) || 0) *
      (shouldResizeFromCenter ? 2 : 1)
    if (scale === 0) {
      return
    }
    // const mapDirectionsToPointerPositions = {
    //   topLeft: [pointerX <= anchorX, pointerY <= anchorY],
    //   topRight: [pointerX >= anchorX, pointerY <= anchorY],
    //   bottomLeft: [pointerX <= anchorX, pointerY >= anchorY],
    //   bottomRight: [pointerX >= anchorX, pointerY >= anchorY]
    // }

    for (const { origin, latest } of currentNodes) {
      if (!origin.width || !origin.height) continue
      const width = origin.width * scale
      const height = origin.height * scale
      const offsetX = origin.x - anchorX
      const offsetY = origin.y - anchorY
      const x = anchorX + offsetX * scale
      const y = anchorY + offsetY * scale
      if (width < 160) {
        newNodesToUpdate.push({
          ...origin,
          x,
          y
        })
      } else {
        newNodesToUpdate.push({
          ...origin,
          x,
          y,
          width,
          height
        })
      }
    }

    newNodesToUpdate.forEach(n => {
      flow.updateNodeSize(n.id, {
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height
      })
    })
    return newNodesToUpdate
  }
}

export default resizeMultipleNodes
