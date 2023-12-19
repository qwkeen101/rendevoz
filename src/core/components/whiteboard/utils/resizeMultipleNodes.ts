import { IWhiteboardInstance, IWhiteboardNode, Size, XYPosition } from '~/typings'
import { getBoxOfNodes } from '@/core/components/whiteboard/utils'
import FlowManager from '@/core/components/whiteboard/FlowManager'

const resizeMultipleNodes = (
  instance: IWhiteboardInstance,
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
      const realTimeBox = instance.nodeOps?.getNodeFuncs(n.id)?.getRealtimeBox()
      if (!realTimeBox)
        throw new Error(`Failed to resize nodes! Reason: DOM of node with id: ${n.id} not found. Node details: ${JSON.stringify(n)}`)
      const latest = {
        ...n,
        x: realTimeBox.left,
        y: realTimeBox.top,
        width: realTimeBox.width,
        height: realTimeBox.height
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
      if (width < 160 && origin.type !== 'freehand') {
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
      console.log(n)
      instance.nodeOps?.getNodeFuncs(n.id)?.updateNodeBox({ left: n.x, top: n.y, width: n.width, height: n.height })
    })
    return newNodesToUpdate
  }
}

export default resizeMultipleNodes
