import FlowManager from '@/core/whiteboard/FlowManager'
import { Box, IWhiteboardNode } from '~/typings'
import { getBoxOfNodes } from '@/core/whiteboard/utils'
import { toPng, toSvg } from 'html-to-image'

const imageWidth = 1920
const imageHeight = 1080
function downloadImage(dataUrl) {
  const a = document.createElement('a')

  a.setAttribute('download', 'reactflow.png')
  a.setAttribute('href', dataUrl)
  a.click()
}
const getTransformForBounds = (bounds: Box, width: number, height: number, minZoom: number, maxZoom: number, padding = 0.1) => {
  const xZoom = width / (bounds.width * (1 + padding))
  const yZoom = height / (bounds.height * (1 + padding))
  const zoom = Math.min(xZoom, yZoom)
  const clampedZoom = clamp(zoom, minZoom, maxZoom)
  const boundsCenterX = bounds.left + bounds.width / 2
  const boundsCenterY = bounds.top + bounds.height / 2
  const x = width / 2 - boundsCenterX * clampedZoom
  const y = height / 2 - boundsCenterY * clampedZoom

  return [x, y, clampedZoom]
}
const clamp = (val: number, min = 0, max = 1): number => Math.min(Math.max(val, min), max)

export const exportWhiteboardAsImage = async (allNodes: IWhiteboardNode[], node: HTMLElement) => {
  const box = getBoxOfNodes(allNodes)
  const transform = getTransformForBounds(box, imageWidth, imageHeight, 0, 200)
  const res = await toPng(node, {
    width: imageWidth,
    height: imageHeight,
    style: {
      width: imageWidth,
      height: imageHeight,
      transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`
    }
  })
  return res
}
