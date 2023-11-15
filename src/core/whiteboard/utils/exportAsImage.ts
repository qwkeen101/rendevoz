import { Box, IWhiteboardNode } from '~/typings'
import { getBoxOfNodes } from '@/core/whiteboard/utils'
import { toPng, toSvg } from 'html-to-image'
import tinycolor from 'tinycolor2'

const imageWidth = 1920
const imageHeight = 1080

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

export const exportWhiteboardAsImage = async (allNodes: IWhiteboardNode[], node: HTMLElement, type: 'svg' | 'png' = 'png') => {
  const box = getBoxOfNodes(allNodes)
  const transform = getTransformForBounds(box, imageWidth, imageHeight, 0, 200)
  const background = window.getComputedStyle(document.body).getPropertyValue('--global-background')
  const rgb = tinycolor(background).toRgbString()
  const config = {
    width: imageWidth,
    height: imageHeight,
    backgroundColor: rgb,
    style: {
      width: imageWidth,
      height: imageHeight,
      transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`
    }
  }
  const res = await (type === 'svg' ? toSvg(node, config) : toPng(node, config))
  return res
}
